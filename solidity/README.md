# LeanIMT+ (Solidity)

Solidity implementation of **LeanIMT+**, a Lean Incremental Merkle Tree extended
with **non-membership** proofs via the indexed-leaf design of the Indexed Merkle
Tree.

The contract-level documentation, design rationale, API, security notes and gas
figures live in [`contracts/README.md`](./contracts/README.md).

## Layout

```
solidity/
├── contracts/
│   ├── Constants.sol             # SNARK field order + leaf domain-separation tag
│   ├── InternalLeanIMTPlus.sol   # core library (all logic, internal functions)
│   ├── LeanIMTPlus.sol           # public wrapper (single shared deployment)
│   └── test/LeanIMTPlusTest.sol  # harness used by the tests + gas benchmark
└── test/
    ├── LeanIMTPlus.ts            # behaviour + independent from-scratch root cross-check
    ├── gas.ts                    # gas benchmark
    └── helpers.ts                # deploy/linking + off-chain low-leaf lookup helpers
```

## Toolchain

- [Hardhat 3](https://hardhat.org) with the `hardhat-toolbox-mocha-ethers` plugin
  (Mocha + ethers v6).
- [`poseidon-solidity`](https://www.npmjs.com/package/poseidon-solidity) for the
  `PoseidonT3` (2-input) and `PoseidonT4` (3-input) hashes.
- Solidity `0.8.28`, `viaIR` + optimizer enabled.

## Scripts

```bash
yarn compile          # compile contracts
yarn test             # run the test suite + gas benchmark
yarn lint             # solhint
```

> The local test network sets `allowUnlimitedContractSize` because the Poseidon
> libraries compile to more than 24 KB. On a real network they are deployed once
> via their deterministic-deployment proxy and linked by address.

Not audited. Review before production use.
