import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

const config: HardhatUserConfig = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      type: "http",
      url: API_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
};

export default config;
