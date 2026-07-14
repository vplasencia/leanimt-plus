import type { HardhatUserConfig } from "hardhat/config"
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers"

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  networks: {
    // The Poseidon libraries compile to > 24 KB. The size limit is a mainnet
    // concern (on-chain they are deployed via a deterministic-proxy) and must
    // be lifted for the local test/coverage network.
    default: {
      type: "edr-simulated",
      allowUnlimitedContractSize: true
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}

export default config
