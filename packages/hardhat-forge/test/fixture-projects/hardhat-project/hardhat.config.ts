// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
          },
        },
      },
      outputSelection: {
        "*": {
          "*": [
            "storageLayout",
            "evm.methodIdentifiers",
            "devdoc",
            "userdoc",
            "abi",
            "evm.gasEstimates",
            "irOptimized",
            "evm.bytecode",
            "evm.bytecode.object",
            "metadata",
          ],
        },
      },
    },
  },
  defaultNetwork: "hardhat",
  paths: {
    artifacts: "bin",
    cache: "bin",
    sources: "src/**/*",
  },
  foundry: {
    buildInfo: true,
    cachePath: "build/cache",
  },
};

export default config;
