# Benchmarks — LeanIMT+ vs SMT

Side-by-side comparison of LeanIMT+ against a Sparse Merkle Tree (SMT). Both
sides use Poseidon as the hash so results reflect the data structure, not the
hash implementation.

- [`node/`](node/) — JS/TS micro-benchmarks of insert + proof generation +
  proof verification, run with [`tinybench`](https://github.com/tinylibs/tinybench)
  across tree sizes 128 / 512 / 1024 / 2048. Compares
  [LeanIMT+](../browser/LeanIMTPlus/src) against
  [`@iden3/js-merkletree`](https://github.com/iden3/js-merkletree).
- [`circuits/`](circuits/) — Circom non-linear constraint counts of the
  verifier circuits across depths 2–32. Compares LeanIMT+'s
  [`leanimt-plus.circom`](../circuits/circuits/leanimt-plus/leanimt-plus.circom)
  against circomlib's
  [`SMTVerifier`](../circuits/node_modules/circomlib/circuits/smt/smtverifier.circom).

See each subfolder's README for how to run and the resulting tables.
