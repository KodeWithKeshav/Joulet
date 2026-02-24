// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JouletToken is ERC20, Ownable {
    address public energyMeter;
    uint256 public constant MINING_DIFFICULTY = 10; 

    event EnergyReported(uint256 kWhProduced, uint256 tokensMinted);

    constructor() ERC20("Joulet", "JLT") Ownable(msg.sender) {
        // Mint an initial genesis supply to the deployer so they can seed the automated DEX liquidity pool
        _mint(msg.sender, 500000 * 10 ** decimals());
    }

    function setEnergyMeter(address _meterAddress) public onlyOwner {
        energyMeter = _meterAddress;
    }

    function reportEnergyProduction(address producerWallet, uint256 kWhAmount) public {
        require(msg.sender == energyMeter, "Only authorized IoT meters can verify generation");
        
        uint256 tokensToMint = kWhAmount / MINING_DIFFICULTY;
        require(tokensToMint > 0, "Not enough energy produced to mint a token");

        _mint(producerWallet, tokensToMint * 10 ** decimals()); 
        
        emit EnergyReported(kWhAmount, tokensToMint);
    }

    function redeemEnergy(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}