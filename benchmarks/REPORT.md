# Benchmark Report: LeanIMT+ vs SMT

Summary of the head-to-head benchmarks between **LeanIMT+** and a **Sparse
Merkle Tree** (`@iden3/js-merkletree` for the JS / TS comparison; circomlib's
`SMTVerifier` for the circuit comparison). Both sides use **Poseidon** as the
hash, so the numbers reflect data-structure overhead rather than hash choice.

Raw data:
- [`node/tables/`](node/tables/)
- [`circuits/tables/circuit-constraints.md`](circuits/tables/circuit-constraints.md)

---

## Test environment

All numbers below were measured on the following setup.

System specifications:

| Component | Value |
| --- | --- |
| Machine | MacBook Pro |
| Chip | Apple M5 |
| Cores | 10 (4 performance + 6 efficiency) |
| Memory | 24 GB |
| OS | macOS 26.5.1 (build 25F80) |

Software environment:

| Tool | Version |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.12.1 |
| tinybench | 6.0.2 |
| @iden3/js-merkletree | 1.5.2 |
| poseidon-lite | 0.3.0 |
| circom | 2.2.3 |
| snarkjs | 0.7.6 |
| circomlib | 2.0.5 |

---

## Node (JS / TS)

Measured with [`tinybench`](https://github.com/tinylibs/tinybench) at tree
sizes 128 / 512 / 1024 / 2048. Every cell shows LeanIMT+'s speedup over SMT
for the same operation at the same size.

| Operation | 128 | 512 | 1024 | 2048 |
| --- | --- | --- | --- | --- |
| Insert | 9.8× | 11.3× | **12.7×** | 2.7× |
| Generate membership proof | 4,423× | **5,323×** | 4,548× | 2,171× |
| Verify membership proof | 2.6× | 2.6× | **3.2×** | 3.1× |
| Generate non-membership proof | 4,885× | **5,055×** | 4,281× | 1,797× |
| Verify non-membership proof | 12.6× | 13.4× | 18.2× | **18.5×** |

Absolute numbers (mean time per operation, ms):

| Operation @ size 2048 | SMT | LeanIMT+ | Speedup |
| --- | --- | --- | --- |
| Insert | 2.47 | 0.93 | 2.7× |
| Generate membership | 0.95 | 0.00066 | 2,171× |
| Verify membership | 5.13 | 1.57 | 3.1× |
| Generate non-membership | 0.91 | 0.00081 | 1,797× |
| Verify non-membership | 5.27 | 0.27 | 19× |

**Note on the proof-generation factors** (the thousands-to-tens-of-thousands
rows): LeanIMT+ builds a proof in sub-microsecond time, while the SMT side
takes milliseconds, so the ratio is large at every size. The spread between
sizes within a single row is sampling noise (30 to 100 samples per task), not
a real size trend; treat those factors as order-of-magnitude. The Insert and
Verify rows, with much smaller per-call gaps, are the more stable steady-state
numbers.

### Why LeanIMT+ wins each operation

- **Insert.** LeanIMT+ recomputes only the path of the affected low leaf
  plus one new leaf, namely `O(log N)` Poseidon calls plus a linear scan
  to find the predecessor. The SMT walks all 32 declared levels even when
  most are empty, plus `pushLeaf` work to materialize a divergence point.
- **Proof generation.** LeanIMT+'s path has depth `ceil(log2 N)` (e.g. 11
  hashes at N = 2048); the SMT path is the full 32 levels regardless of
  population. This is the dominant factor.
- **Verification.** LeanIMT+ walks `ceil(log2 N)` Poseidon hashes against
  the SMT's 32 levels. Non-membership verification widens the gap further
  because the SMT verifier also threads the state-machine logic
  (`oldKey / oldValue / isOld0 / fnc`) needed to distinguish exclusion from
  inclusion at each level.

### Where LeanIMT+ is *not* free

- `indexOf`, `has`, and the low-leaf walk are **O(N)** linear scans of the
  user-leaf array. For the sizes measured (≤2048), this is dwarfed by the
  per-level Poseidon cost. Past ~10⁵ leaves it would start to dominate, and
  an external sorted index would be required to keep proof generation cheap.
- The benchmark mutates a single tree in place across iterations, so the
  measured "size" drifts upward by `iterations` (20). The drift is small
  relative to baseline `size` and does not change the ordering.

---

## Circuits (Circom, BN254)

Non-linear constraint counts of the verifier circuit at varying tree depths.
Both sides use Poseidon (`circomlib/poseidon.circom` for LeanIMT+,
`circomlib/smt/smthash_poseidon.circom` for SMT).

| Depth | LeanIMT+ | SMT | Δ (SMT minus LeanIMT+) | Ratio |
| --- | --- | --- | --- | --- |
| 2 | 2,031 | 2,055 | 24 | 1.01× |
| 8 | 3,513 | 3,561 | 48 | 1.01× |
| 16 | 5,489 | 5,569 | 80 | 1.01× |
| 32 | 9,441 | 9,585 | 144 | **1.02×** |

Per-level slope (constraints added per extra depth level):

| Tree | Slope (≈ constraints/level) |
| --- | --- |
| LeanIMT+ | 247 (one Poseidon hash plus a small mux plus an `IsEqual` gate) |
| SMT | 251 (one Poseidon hash plus state-machine bookkeeping per level) |

### Takeaways

- LeanIMT+ is **always cheaper than SMT** in this comparison, at every
  depth in the sweep, but the margin is small in relative terms (~1-2 %).
- The advantage **grows in absolute terms with depth**: +24 constraints at
  depth 2, rising to +144 at depth 32. The ratio stays essentially flat at
  1.01-1.02× across the whole sweep.
- Per-level slope is nearly identical (~250 constraints), since both designs
  hash one Poseidon node per level. LeanIMT+ adds ~247 constraints/level
  against the SMT's ~251.
- That ~4 constraint/level difference is the SMT verifier's per-level
  **state-machine bookkeeping** (`SMTVerifierSM` / `SMTLevIns`), which
  encodes the "include / exclude / not-applicable" branch logic that
  LeanIMT+ does not need (its proofs are unified by `proofType` and one
  `LessThan` plus an `IsZero`). So the **gap is additive**, accumulating
  ~4 constraints for every extra level of depth.

---

## Bottom-line

For both off-chain (JS / TS) and in-circuit (Circom) workloads, LeanIMT+
beats an SMT of comparable depth on every operation measured, while
preserving the same security guarantees and supporting the same set of
proofs (membership and non-membership).

The reasons are structural, not implementation tuning:

1. **Dynamic depth.** LeanIMT+'s tree depth tracks `ceil(log2 N)`, while a
   classical SMT fixes a worst-case depth (32 here) up front. Every
   per-level cost (hashes, sibling slots, circuit constraints) pays for
   that worst case whether or not it is needed.
2. **Unified proof shape.** Both membership and non-membership proofs in
   LeanIMT+ are a single Merkle path against an indexed leaf; the
   verifier's only branching is one boolean (`proofType`). The SMT verifier
   needs an explicit per-level state machine to encode the same distinction.
3. **No zero hashes.** LeanIMT+ promotes unpaired right children unchanged,
   so it never spends a Poseidon call on an empty subtree. The SMT pays for
   every empty level it traverses.

LeanIMT+'s cost is paid almost entirely on the prover / inserter side as a
linear scan over user leaves. For the sizes targeted by typical revocation
or set-membership use cases (≤ 2¹⁵), that cost stays well below the
per-level Poseidon work it replaces.
