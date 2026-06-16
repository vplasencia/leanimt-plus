# node: LeanIMT+ test suite

Jest test suite for the TypeScript LeanIMT+ implementation that lives in
[`browser/LeanIMTPlus/src/`](../browser/LeanIMTPlus/src/). Tests import the
source directly; there is no separate package build step.

The suite covers the data structure, the AVL ordered index, the unified
proof generation / verification, the security guards documented in
[`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md), and the JSON
`export` / `import` round-trip.

## Prerequisites

- **Node.js** ≥ 18 (any current LTS works).
- A package manager. Instructions below cover both Yarn and npm.

## Install

```bash
cd node
yarn        # or: npm install
```

## Run the tests

```bash
# Yarn
yarn test

# or directly with Jest (works without Yarn)
npx jest

# Run a single test by name
npx jest -t "tombstone replay guard"

# Run a single file
npx jest tests/leanimt-plus.test.ts

# Watch mode while iterating on the implementation
npx jest --watch
```

## Other tasks

```bash
yarn prettier         # check formatting
yarn prettier:write   # auto-format
```

## How the tests are wired

- [`tests/leanimt-plus.test.ts`](tests/leanimt-plus.test.ts) imports the
  data-structure source from `../../browser/LeanIMTPlus/src` so changes
  there are picked up immediately; no build / publish step.
- The hash functions used in tests are `poseidon3` (leaf, 3-input for
  domain separation) and `poseidon2` (internal) from `poseidon-lite`.

## See also

- Usage guide: [`USAGE.md`](USAGE.md).
