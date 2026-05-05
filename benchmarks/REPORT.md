# Benchmark Report: LeanIMT+ vs SMT

Summary of the head-to-head benchmarks between **LeanIMT+** and a **Sparse
Merkle Tree** (`@iden3/js-merkletree` for the JS / TS comparison; circomlib's
`SMTVerifier` for the circuit comparison). Both sides use **Poseidon** as the
hash, so the numbers reflect data-structure overhead rather than hash choice.

Raw data:
- [`node/tables/`](node/tables/)
- [`circuits/tables/circuit-constraints.md`](circuits/tables/circuit-constraints.md)

---

## Node (JS / TS)

Measured with [`tinybench`](https://github.com/tinylibs/tinybench) at tree
sizes 128 / 512 / 1024 / 2048. Every cell shows LeanIMT+'s speedup over SMT
for the same operation at the same size.

| Operation | 128 | 512 | 1024 | 2048 |
| --- | --- | --- | --- | --- |
| Insert | **29.1×** | 8.8× | 9.7× | 10.8× |
| Generate membership proof | **17,512×** | 266× | 52× | 34× |
| Verify membership proof | 3.2× | 2.8× | 3.0× | 3.5× |
| Generate non-membership proof | **6,895×** | 28× | 16× | 42× |
| Verify non-membership proof | 14.7× | **44.0×** | 42.7× | 40.4× |

Absolute numbers (mean time per operation, ms):

| Operation @ size 2048 | SMT | LeanIMT+ | Speedup |
| --- | --- | --- | --- |
| Insert | 5.73 | 0.53 | 10.8× |
| Generate membership | 0.047 | 0.0014 | 34× |
| Verify membership | 3.62 | 1.02 | 3.5× |
| Generate non-membership | 0.277 | 0.0067 | 42× |
| Verify non-membership | 5.89 | 0.146 | 40× |

**Note on the 128-row outliers** (very large speedup factors): those rows are
the first task tinybench runs and absorb most of the JIT warmup. In the
absence of a warmup phase, the SMT side pays one-time class-loading and
optimization cost, inflating its mean. The 512+ rows are the more reliable
steady-state numbers.

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
| 2 | 1,257 | 2,073 | 816 | **1.65×** |
| 8 | 2,751 | 3,597 | 846 | 1.31× |
| 16 | 4,743 | 5,629 | 886 | 1.19× |
| 32 | 8,727 | 9,693 | 966 | 1.11× |

Per-level slope (constraints added per extra depth level):

| Tree | Slope (≈ constraints/level) |
| --- | --- |
| LeanIMT+ | 249 (one Poseidon hash plus a small mux plus an `IsEqual` gate) |
| SMT | 254 (one Poseidon hash plus state-machine bookkeeping per level) |

### Takeaways

- LeanIMT+ is **always cheaper than SMT** in this comparison, at every
  depth in the sweep.
- The advantage is largest at shallow depths and shrinks as the per-level
  Poseidon cost dominates. At depth 32 the verifier circuits differ by only
  ~970 constraints (≈10 %).
- The fixed gap is the SMT verifier's **state-machine fixed cost**:
  `SMTVerifierSM` and `SMTLevIns` add ~900 constraints regardless of
  depth, encoding the "include / exclude / not-applicable" branch logic
  that LeanIMT+ does not need (its proofs are unified by `proofType` and
  one `LessThan` plus an `IsZero`).
- Per-level slope is essentially identical (~250 constraints), since both
  designs hash one Poseidon node per level. So the **gap is additive, not
  multiplicative**: as depth grows, LeanIMT+'s relative win narrows but its
  absolute win is roughly constant at +900 constraints.

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
