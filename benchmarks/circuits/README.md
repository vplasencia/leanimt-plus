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

## How to run

```bash
./scripts/run.sh
```

Requires `circom` on PATH. Reuses the `circomlib` install from `../../circuits/node_modules/`.

Outputs:
- [tables/circuit-constraints.md](tables/circuit-constraints.md) — markdown
  table with one row per depth.
- `build/` — generated wrappers, `.r1cs` files, and per-circuit logs (gitignored).

## Results

See [tables/circuit-constraints.md](tables/circuit-constraints.md).

LeanIMT+ verification is consistently cheaper than SMT verification at every
depth, with a fixed-cost gap of ~900–1000 constraints from the SMT verifier's
state-machine logic (`SMTVerifierSM`, `SMTLevIns`) needed to thread a sparse
linked structure. The relative advantage is largest at shallow depths (where
the per-level Poseidon dominates less of the total) and shrinks as the
verifier gets dominated by the linear per-level cost — both circuits add ~250
constraints per extra level.
