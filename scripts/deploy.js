import { ethers } from "ethers";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.API_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const artifact = JSON.parse(
    readFileSync(
      "./artifacts/contracts/HelloWorld.sol/HelloWorld.json",
      "utf8",
    ),
  );

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet,
  );
  const contract = await factory.deploy("Hello World!");

  await contract.waitForDeployment();
  console.log("Contract deployed to address:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
