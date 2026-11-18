// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./OracleRegistry.sol";

/**
 * @title JouletToken
 * @notice ERC20 token for the Joulet decentralized energy trading platform.
 *         Includes integrated Carbon Credit NFT tracking (lightweight, no full ERC721
 *         to avoid event namespace collision with ERC20 in a single contract).
 *         In production, the Carbon NFT would be a separate ERC721 contract.
 * 
 * @dev CONFIGURATION NOTE:
 *      Demo/MVP: currentDifficulty = 10 (10 kWh = 1 JLT) for fast token visualization
 *      Production: Set to 1000 (1000 kWh = 1 JLT) for economic model compliance
 *      Adjustable via setDifficulty() function
 */
contract JouletToken is ERC20, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public oracleConsensus;
    
    // Dynamic difficulty: Engine adjusts this to control minting rate.
    // In a fully trustless system, the contract would calculate this via block timestamps.
    // DEMO CONFIGURATION: Set to 10 for hackathon (change to 1000 for production)
    uint256 public currentDifficulty = 10; 

    // ---------- Fractional JLT Tracking ----------
    mapping(address => uint256) public providerAccumulatedKwhForTokens;
    
    // ---------- Carbon Credit NFT (Lightweight Tracking) ----------
    uint256 private _nftTokenIds;
    
    struct CarbonNFT {
        address owner;
        uint256 mintedAt;
        uint256 kWhRepresented;
    }
    
    mapping(uint256 => CarbonNFT) public carbonNfts;
    mapping(address => uint256) public carbonNftBalance;
    
    // ---------- Verified Batch Tracking ----------
    struct VerifiedBatch {
        bytes32 merkleRoot;
        uint256 totalKwh;
        uint256 timestamp;
    }
    
    mapping(uint256 => VerifiedBatch) public batches;
    uint256 public currentBatchId;
    
    // Tracking energy to mint NFTs (1220 kWh = 1 Carbon Credit NFT)
    mapping(address => uint256) public providerAccumulatedKwh;
    uint256 public constant NFT_MINT_THRESHOLD = 1220;

    // ---------- Events ----------
    event EnergyReported(uint256 indexed batchId, address indexed producerWallet, uint256 kWhProduced, uint256 tokensMinted, bytes32 merkleRoot);
    event CarbonNftMinted(address indexed producerWallet, uint256 indexed nftId, uint256 kWhRepresented);

    constructor() ERC20("Joulet", "JLT") Ownable(msg.sender) {
        // Mint genesis supply to deployer for seeding the DEX liquidity pool
        _mint(msg.sender, 500000 * 10 ** decimals());
    }

    function setOracleConsensus(address _consensusAddress) public onlyOwner {
        oracleConsensus = _consensusAddress;
    }
    
    function setDifficulty(uint256 _newDifficulty) public {
        require(msg.sender == oracleConsensus || msg.sender == owner(), "Unauthorized");
        currentDifficulty = _newDifficulty;
    }

    /**
     * @notice Reports verified energy production. Mints JLT tokens and auto-creates
     *         Carbon Credit NFTs when the producer exceeds the threshold.
     * @param producerWallet The energy producer's wallet address
     * @param kWhAmount Amount of energy produced in kWh (x10 for precision)
     * @param merkleRoot Merkle root of the verified batch data
     */
    function reportEnergyProduction(address producerWallet, uint256 kWhAmount, bytes32 merkleRoot) public {
        require(msg.sender == oracleConsensus, "Only authorized Consensus Engine can verify generation");
        
        providerAccumulatedKwhForTokens[producerWallet] += kWhAmount;
        uint256 tokensToMint = providerAccumulatedKwhForTokens[producerWallet] / currentDifficulty;

        if (tokensToMint > 0) {
            // Mint JLT Tokens
            _mint(producerWallet, tokensToMint * 10 ** decimals()); 
            providerAccumulatedKwhForTokens[producerWallet] -= (tokensToMint * currentDifficulty);
        }
        
        // Record Batch
        uint256 batchId = currentBatchId++;
        batches[batchId] = VerifiedBatch({
             merkleRoot: merkleRoot,
             totalKwh: kWhAmount,
             timestamp: block.timestamp
        });
        
        // Auto-mint Carbon Credit NFT Logic
        providerAccumulatedKwh[producerWallet] += kWhAmount;
        if (providerAccumulatedKwh[producerWallet] >= NFT_MINT_THRESHOLD) {
             // Create Carbon Credit NFT
             uint256 newItemId = _nftTokenIds++;
             carbonNfts[newItemId] = CarbonNFT({
                 owner: producerWallet,
                 mintedAt: block.timestamp,
                 kWhRepresented: NFT_MINT_THRESHOLD
             });
             carbonNftBalance[producerWallet]++;
             
             // Deduct the used accumulated energy
             providerAccumulatedKwh[producerWallet] -= NFT_MINT_THRESHOLD;
             
             emit CarbonNftMinted(producerWallet, newItemId, NFT_MINT_THRESHOLD);
        }
        
        emit EnergyReported(batchId, producerWallet, kWhAmount, tokensToMint, merkleRoot);
    }

    // =====================================================================
    //  Quorum-verified settlement path (paper Section IV-E, Algorithm 2)
    //
    //  Unlike reportEnergyProduction() above, which trusts one submitter
    //  address (the original MVP path, kept for backward compatibility),
    //  this path trusts no submitter: it re-verifies the oracle signatures
    //  on-chain with ecrecover, requires a weighted two-thirds quorum of
    //  staked oracles, enforces a monotonic timestamp and the physical
    //  bound  E <= kappa * P_rated * dt / 1000  (kJ), and slashes the
    //  signers of a batch that violates the bound. 1 JLT = 1 kJ.
    // =====================================================================
    OracleRegistry public registry;
    uint256 public kappaBps = 10_000;                  // kappa = 1.00
    uint256 public constant MAX_FUTURE_SKEW = 300;     // seconds
    mapping(address => uint256) public deviceRatedW;       // producer => registered capacity (W)
    mapping(address => uint256) public lastBatchTimestamp; // producer => last processed batch time
    mapping(uint256 => bytes32) public verifiedBatchRoot;  // audit anchor per accepted batch
    uint256 public verifiedBatchCount;

    struct Batch {
        address producer;
        uint256 energyKJ;      // verified energy in kJ (1 JLT per kJ)
        uint256 dtSeconds;     // time since the previous mint
        bytes32 merkleRoot;    // root over the signed readings of the batch
        uint256 timestamp;     // oracle-side batch time (monotonic per producer)
    }

    event VerifiedBatchMinted(uint256 indexed batchId, address indexed producer, uint256 energyKJ, bytes32 merkleRoot, uint256 signedWeight);
    event BatchRejectedOverCapacity(address indexed producer, uint256 energyKJ, uint256 boundKJ, uint256 slashedOracles);

    function setRegistry(address registry_) external onlyOwner {
        registry = OracleRegistry(registry_);
    }

    function registerDevice(address producer, uint256 ratedW) external onlyOwner {
        require(ratedW > 0, "zero capacity");
        deviceRatedW[producer] = ratedW;
    }

    function setKappaBps(uint256 kappaBps_) external onlyOwner {
        require(kappaBps_ >= 10_000 && kappaBps_ <= 20_000, "kappa out of range");
        kappaBps = kappaBps_;
    }

    /// @notice Physical bound in kJ: kappa * P_rated(W) * dt(s) / 1000.
    function physicalBoundKJ(address producer, uint256 dtSeconds) public view returns (uint256) {
        return (kappaBps * deviceRatedW[producer] * dtSeconds) / (10_000 * 1000);
    }

    /// @notice Digest the oracles sign for a batch (domain-separated by chain and contract).
    function batchDigest(Batch calldata b) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), b.producer, b.energyKJ, b.dtSeconds, b.merkleRoot, b.timestamp));
    }

    /**
     * @notice Settle a batch attested by a weighted two-thirds quorum of staked oracles.
     * @return minted true if JLT was minted, false if the batch violated the
     *         physical bound (its signers are slashed and nothing is minted).
     */
    function reportVerifiedBatch(Batch calldata b, bytes[] calldata sigs) external returns (bool minted) {
        require(address(registry) != address(0), "registry unset");
        require(deviceRatedW[b.producer] > 0, "unregistered device");
        require(b.energyKJ > 0 && b.dtSeconds > 0, "empty batch");
        require(b.timestamp > lastBatchTimestamp[b.producer], "stale timestamp");
        require(b.timestamp <= block.timestamp + MAX_FUTURE_SKEW, "future timestamp");

        (uint256 signedW, address[] memory signers) = _collectSigners(b, sigs);
        require(signedW * 3 > registry.totalWeight() * 2, "quorum not reached");

        // Advance the clock before any slash so that a replay cannot slash twice.
        lastBatchTimestamp[b.producer] = b.timestamp;

        uint256 boundKJ = physicalBoundKJ(b.producer, b.dtSeconds);
        if (b.energyKJ > boundKJ) {
            for (uint256 i = 0; i < signers.length; i++) registry.slash(signers[i]);
            emit BatchRejectedOverCapacity(b.producer, b.energyKJ, boundKJ, signers.length);
            return false;
        }

        _mint(b.producer, b.energyKJ * 10 ** decimals());
        uint256 id = verifiedBatchCount++;
        verifiedBatchRoot[id] = b.merkleRoot;
        for (uint256 i = 0; i < signers.length; i++) registry.reward(signers[i]);
        emit VerifiedBatchMinted(id, b.producer, b.energyKJ, b.merkleRoot, signedW);
        return true;
    }

    function _collectSigners(Batch calldata b, bytes[] calldata sigs)
        private
        view
        returns (uint256 w, address[] memory signers)
    {
        bytes32 digest = batchDigest(b).toEthSignedMessageHash();
        signers = new address[](sigs.length);
        for (uint256 i = 0; i < sigs.length; i++) {
            address s = ECDSA.recover(digest, sigs[i]);
            uint256 ws = registry.weightOf(s);
            require(ws > 0, "signer not active");
            for (uint256 j = 0; j < i; j++) require(signers[j] != s, "duplicate signer");
            signers[i] = s;
            w += ws;
        }
    }

    function redeemEnergy(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Simplified ZK-SNARK proof verifier for demo purposes.
     *         In production, this would be a full Groth16 pairing verifier.
     */
    function verifyPhysicsProof(bytes memory proofData, uint256[] memory publicInputs) public pure returns (bool) {
         require(proofData.length > 0, "Empty proof");
         require(publicInputs.length >= 3, "Requires V, I, P public inputs");
         
         uint256 v = publicInputs[0];
         uint256 i = publicInputs[1];
         uint256 p = publicInputs[2];
         
         // Real math check on the smart contract replacing ZK mock
         // Inputs scaled by 100 to preserve precision
         uint256 calcP = (v * i) / 100000; 
         
         uint256 diff = calcP > p ? calcP - p : p - calcP;
         return diff <= (p / 20) + 1; // within 5% error margin
    }
    
    /**
     * @notice Returns the total number of Carbon Credit NFTs minted
     */
    function totalCarbonNfts() public view returns (uint256) {
        return _nftTokenIds;
    }
}