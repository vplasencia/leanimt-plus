# Circuit benchmarks — LeanIMT+ vs SMT

Compares the **non-linear constraint count** of the LeanIMT+ proof verifier
circuit against circomlib's `SMTVerifier` across tree depths. Both circuits
use Poseidon as the underlying hash so the counts are directly comparable.

## What is measured

For each depth `d` in `{2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32}`:

- `LeanIMTPlus(d)` — the unified membership / non-membership verifier from
  [circuits/leanimt-plus/leanimt-plus.circom](../../circuits/circuits/leanimt-plus/leanimt-plus.circom).
- `SMTVerifier(d)` — circomlib's Sparse Merkle Tree verifier with Poseidon.

Each circuit is wrapped at the chosen depth and compiled with `circom --r1cs`.
The non-linear constraint count is parsed from the compiler output.

## Prerequisites

- **`circom`** 2.x on `$PATH` (see
  [docs.circom.io](https://docs.circom.io/getting-started/installation/)).
- The `circomlib` install from [`../../circuits/`](../../circuits/) —
  if missing, run `yarn` there first:
  ```bash
  (cd ../../circuits && yarn)
  ```

## How to run

```bash
cd benchmarks/circuits
./scripts/run.sh
```

If the script isn't executable on your machine:
```bash
bash scripts/run.sh
```

Each depth in `{2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32}` is compiled
twice (once for LeanIMT+, once for `SMTVerifier`) and the non-linear
constraint count is parsed from `circom`'s log output.

Outputs:
- [tables/circuit-constraints.md](tables/circuit-constraints.md) — markdown
  table with one row per depth.
- `build/` — generated wrappers, `.r1cs` files, and per-circuit logs (gitignored).

## Clean up

```bash
rm -rf build/
```

## Results

See [tables/circuit-constraints.md](tables/circuit-constraints.md).

LeanIMT+ verification is consistently cheaper than SMT verification at every
depth, with a fixed-cost gap of ~900–1000 constraints from the SMT verifier's
state-machine logic (`SMTVerifierSM`, `SMTLevIns`) needed to thread a sparse
linked structure. The relative advantage is largest at shallow depths (where
the per-level Poseidon dominates less of the total) and shrinks as the
verifier gets dominated by the linear per-level cost — both circuits add ~250
constraints per extra level.
