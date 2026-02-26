// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title JouletToken
 * @notice ERC20 token for the Joulet decentralized energy trading platform.
 *         Includes integrated Carbon Credit NFT tracking (lightweight, no full ERC721
 *         to avoid event namespace collision with ERC20 in a single contract).
 *         In production, the Carbon NFT would be a separate ERC721 contract.
 */
contract JouletToken is ERC20, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public oracleConsensus;
    
    // Dynamic difficulty: Engine adjusts this to control minting rate.
    // In a fully trustless system, the contract would calculate this via block timestamps.
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

    function redeemEnergy(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Simplified ZK-SNARK proof verifier for demo purposes.
     *         In production, this would be a full Groth16 pairing verifier.
     */
    function verifyPhysicsProof(bytes memory proofData, uint256[] memory publicInputs) public pure returns (bool) {
         require(proofData.length > 0, "Empty proof");
         require(publicInputs.length > 0, "No public inputs");
         return true; 
    }
    
    /**
     * @notice Returns the total number of Carbon Credit NFTs minted
     */
    function totalCarbonNfts() public view returns (uint256) {
        return _nftTokenIds;
    }
}