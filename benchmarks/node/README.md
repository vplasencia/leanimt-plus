# Node benchmarks — LeanIMT+ vs SMT

Compares the JS / TS performance of LeanIMT+ against an SMT
([@iden3/js-merkletree](https://github.com/iden3/js-merkletree)) for the
operations needed to issue and verify membership / non-membership proofs.

Both libraries use Poseidon (`poseidon-lite` for LeanIMT+; built-in for the
SMT) so the results reflect data-structure overhead rather than hash
implementation differences.

## Operations measured

| Script | What it benchmarks |
| ------ | ------------------ |
| `insert.ts` | Inserting one new member into a tree of size N |
| `generate-membership.ts` | Generating an inclusion proof for an existing member |
| `verify-membership.ts` | Verifying an inclusion proof |
| `generate-non-membership.ts` | Generating a non-membership proof for an absent value |
| `verify-non-membership.ts` | Verifying a non-membership proof |

Each operation is benchmarked at tree sizes **128, 512, 1024, 2048**.

The harness is [`tinybench`](https://github.com/tinylibs/tinybench) with
warmup disabled and a fixed `iterations` count per task. The SMT row is the
baseline; the `Relative to SMT` column shows LeanIMT+'s speedup.

## How to run

```bash
npm install
npm run bench:all                    # runs every script in sequence
# or run them individually:
npm run bench:insert
npm run bench:generate-membership
npm run bench:verify-membership
npm run bench:generate-non-membership
npm run bench:verify-non-membership
```

Each script writes a markdown table into [`tables/`](tables/).

## Results

See the per-operation tables in [tables/](tables/):

- [insert.md](tables/insert.md)
- [generate-membership.md](tables/generate-membership.md)
- [verify-membership.md](tables/verify-membership.md)
- [generate-non-membership.md](tables/generate-non-membership.md)
- [verify-non-membership.md](tables/verify-non-membership.md)

### Why LeanIMT+ wins on most operations

- **Insert** — LeanIMT+ recomputes only the path of the affected low leaf
  plus one new leaf, against an SMT's full traversal of every level (32 by
  default), even when most of those levels are empty.
- **Membership / non-membership proof generation** — LeanIMT+ collects a
  ceil(log2 N)-deep path; SMT collects a 32-level sibling list.
- **Verification** — both walk a path of hashes; LeanIMT+ avoids SMT's
  state-machine bookkeeping (`oldKey / oldValue / isOld0 / fnc`) needed to
  distinguish inclusion from exclusion at the right level.

LeanIMT+'s linear `indexOf` becomes the dominant cost only for very large
trees. For the operations measured here (single insert, single proof) that
cost is dwarfed by the per-level Poseidon work and never exceeds it.
