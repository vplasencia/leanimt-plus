# Benchmarks — LeanIMT+ vs SMT

Side-by-side comparison of LeanIMT+ against a Sparse Merkle Tree (SMT). Both
sides use Poseidon as the hash so results reflect the data structure, not the
hash implementation.

Two complementary suites:

| folder | what it measures | tool |
|---|---|---|
| [`node/`](node/) | JS/TS wall-clock: insert + proof generation + proof verification at tree sizes 128 / 512 / 1024 / 2048 | [`tinybench`](https://github.com/tinylibs/tinybench) |
| [`circuits/`](circuits/) | Circom non-linear constraint counts of the verifier circuits at depths 2–32 | `circom --r1cs` |

Each subfolder writes a markdown table into its `tables/` directory.

---

## Quick start

```bash
# JS/TS benchmarks (no circom required)
cd benchmarks/node
yarn        # or: npm install
yarn bench:all

# Circom constraint counts (requires `circom` on PATH)
cd benchmarks/circuits
./scripts/run.sh
```

See [`node/README.md`](node/README.md) and [`circuits/README.md`](circuits/README.md) for the full per-operation command list and what each result means.

---

## What's compared

- LeanIMT+ from [`browser/LeanIMTPlus/src`](../browser/LeanIMTPlus/src) with
  `poseidon-lite` hashes.
- SMT from [`@iden3/js-merkletree`](https://github.com/iden3/js-merkletree)
  (built-in Poseidon).
- LeanIMT+ verifier circuit from
  [`circuits/leanimt-plus/leanimt-plus.circom`](../circuits/circuits/leanimt-plus/leanimt-plus.circom).
- SMT verifier circuit from `circomlib/circuits/smt/smtverifier.circom`.

---

## Prerequisites

- **Node.js** ≥ 18.
- **For circuit benchmarks**: `circom` 2.x on `$PATH`
  (see [docs.circom.io](https://docs.circom.io/getting-started/installation/)).
  The script reuses the `circomlib` install from
  [`../circuits/node_modules/`](../circuits/), so run
  `yarn` inside [`../circuits/`](../circuits/) first if you haven't.
