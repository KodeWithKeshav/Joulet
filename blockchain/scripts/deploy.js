const hre = require("hardhat");

async function main() {
  // 1. Get the contract factory (this matches the name "contract JouletToken" in your .sol file)
  const JouletToken = await hre.ethers.getContractFactory("JouletToken");

  // 2. Deploy the contract
  console.log("Deploying JouletToken...");
  const joulet = await JouletToken.deploy();

  // 3. Wait for the transaction to be mined
  await joulet.waitForDeployment();

  // 4. Get the final address
  const address = await joulet.getAddress();

  // Authorize the deployer (Account #0) as a valid Energy Meter Oracle of the system
  const [deployer] = await hre.ethers.getSigners();
  await joulet.setEnergyMeter(deployer.address);
  console.log(`Authorized Energy Meter: ${deployer.address}`);

  console.log("------------------------------------------------");
  console.log(`Joulet Token successfully deployed to: ${address}`);
  console.log("------------------------------------------------");
}

// Standard boilerplate to handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});