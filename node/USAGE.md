# LeanIMT+

A **LeanIMT** (Lean Incremental Merkle Tree) extended with **non-membership
proofs**, using the indexed-leaf design from the Indexed Merkle Tree.

LeanIMT gives you cheap append-only inclusion proofs over a binary Merkle
tree with dynamic depth. LeanIMT+ adds the ability to *prove that a value
is not in the tree* without revealing the full leaf set, by storing
indexed leaves that form a sorted singly-linked list over inserted values.

---

## Install

```bash
yarn add leanimt-plus      # placeholder — package name TBD
```

```ts
import { LeanIMTPlus } from "leanimt-plus"
```

---

## Quick start

```ts
import { LeanIMTPlus } from "leanimt-plus"
import { poseidon2 } from "poseidon-lite" // or any (a, b) => bigint hash

const tree = new LeanIMTPlus<bigint>(poseidon2)

tree.insert(42n)
tree.insertMany([7n, 100n, 3n])

console.log(tree.root)
console.log(tree.size)   // 4 user-inserted values

// Unified proof API: returns membership if v is in the tree,
// non-membership otherwise.
const inProof  = tree.generateProof(42n)  // proofType: 0 (membership)
const outProof = tree.generateProof(50n)  // proofType: 1 (non-membership)

tree.verifyProof(inProof)   // true
tree.verifyProof(outProof)  // true
```

---

## How it works

### Indexed leaves

Each leaf is an indexed record:

```ts
{ value, nextValue }
```

The leaves form an *implicit* sorted linked list: a leaf with
`nextValue = v` logically points to the leaf whose `value = v`. The
*commitment* of the leaf — what is actually stored at level 0 of the
underlying LeanIMT — is `hash(value, nextValue)`. The commitment is
**not** stored on the record itself; it is derivable.

### Sentinel

The tree starts empty. On the first `insert(v)`, two leaves are appended
together:

| Index | value | nextValue |
|------:|------:|----------:|
| 0 (sentinel)  | `0` | `v` |
| 1 (first leaf)| `v` | `0` |

The **tail** of the list is always the leaf whose `nextValue === 0` —
the end-of-list marker.

Every subsequent `insert(v)`:

1. Scans the leaf array to find the **low leaf** `L` such that
   `L.value < v` and either `L.nextValue > v` or `L` is the tail.
2. Appends a new leaf inheriting `L`'s old `nextValue`.
3. Rewires `L.nextValue` to point at `v`.
4. Recomputes only the affected Merkle ancestors.

### Unified proofs

`generateProof(value)` returns a `LeanIMTPlusProof` discriminated by a
numeric `proofType` (kept as `0 | 1` rather than a string union so it is
cheap to pass through ZK circuits and binary serializers):

| `proofType` | When | Verifier extra check |
|---|---|---|
| `0` (membership) | `value` is in the tree | `leaf.value === value` |
| `1` (non-membership) | `value` is absent | `leaf.value < value` AND (`leaf.nextValue > value` OR `leaf.nextValue === 0`) |

Both kinds share the same Merkle-path verification:
`hash(leaf.value, leaf.nextValue)` walked up the path must equal `root`.

---

## API reference

### `new LeanIMTPlus<N>(hash, values?, zero?, lt?)`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `hash` | `(a: N, b: N) => N` | required | Hash used for both internal nodes and leaf commitments. |
| `values` | `N[]` | `[]` | Optional initial values to insert. |
| `zero` | `N` | `0n` | Zero element of `N`. Reserved for the sentinel and end-of-list marker. |
| `lt` | `(a: N, b: N) => boolean` | native `<` | Strict less-than comparator. |

```ts
// Defaults are bigint-friendly, so seeding a tree is one line:
const tree = new LeanIMTPlus(hash, [10n, 20n, 5n])

// Override zero/lt only when N isn't bigint:
const numTree = new LeanIMTPlus<number>(numHash, [], 0, (a, b) => a < b)
```

### Properties

| Member | Type | Notes |
|---|---|---|
| `root` | `N` | Current Merkle root. |
| `size` | `number` | Number of user-inserted values. The internal sentinel is **not** counted. |
| `depth` | `number` | Depth of the underlying LeanIMT. |
| `leaves` | `LeanIMTPlusLeaf<N>[]` | Defensive copy of the user-inserted indexed leaves (each `{ value, nextValue }`). The internal sentinel is **not** included. Order is the physical insertion order, not the sorted order. |

### Methods

#### `insert(v: N)`

Insert `v`. Throws if `v === zero` or if `v` is already a member.

#### `insertMany(values: N[])`

Insert each value in order. Prefer over a loop of `insert` calls when
adding many values at once: each affected internal node is rehashed at
most once even when several inserts share ancestors. Throws on an empty
array, on `zero`, or on duplicates.

#### `indexOf(v: N): number`

Position of the leaf with `value === v`, or `-1` if absent. The sentinel
(`zero`) is never reported as a member.

#### `has(v: N): boolean`

Convenience wrapper around `indexOf`.

#### `generateProof(value: N): LeanIMTPlusProof<N>`

Returns a membership proof (`proofType: 0`) if `value` is in the tree, or
a non-membership proof (`proofType: 1`) otherwise. Throws on `zero` or
empty tree.

```ts
type LeanIMTPlusProof<N> = {
    proofType: 0 | 1               // 0 = membership, 1 = non-membership
    root: N
    value: N                       // queried value
    leaf: LeanIMTPlusLeaf<N>       // proven leaf — for non-membership this is the low leaf
    leafIndex: number              // path bits, packed LSB-first
    siblings: N[]
}
```

#### `verifyProof(proof): boolean`

Runs the kind-specific check, then recomputes
`hash(leaf.value, leaf.nextValue)` and walks the Merkle path against
`proof.root`.

#### `static verifyProof(proof, hash, zero?, lt?)`

Verifier-only entry point — no tree instance required. Useful for light
clients or anywhere proofs are consumed without holding the full tree.

#### `export(): string`

Serializes the full tree state (level-0 commitments, internal nodes, and
indexed leaves) to JSON. `bigint`s are stored as decimal strings.

#### `static import<N>(hash, data, zero?, lt?, map?)`

Restores a tree from `export()`. The optional `map` parameter converts
each serialized field back into `N` — defaults to `BigInt(s)`.

---

## Custom value types

LeanIMT+ is generic over the leaf type `N`. The defaults assume `bigint`,
but you can plug in any totally ordered type:

```ts
const tree = new LeanIMTPlus<number>(
    (a, b) => myHash32(a, b),
    /* zero */ 0,
    /* lt   */ (a, b) => a < b
)
```

Whatever you pass for `zero` is reserved as the sentinel value and the
end-of-list marker. Make sure no real input value ever equals it.

---

## Caveats

- **Don't insert `zero`.** It's reserved for the sentinel and the
  end-of-list marker. `insert` throws.
- **Linear scans.** `indexOf`, `has`, and the low-leaf walk are all O(n).
  Proof *generation* is therefore O(n + log n); proof *verification* is
  O(log n).
- **Hash agreement.** Provers and verifiers must use the same `hash`,
  `zero`, and `lt`. Mismatched parameters silently produce invalid proofs.
- **Not constant-time.** The library makes no constant-time guarantees
  and is not hardened against side-channel attacks.

---

## References

- LeanIMT TS reference implementation:
  https://github.com/zk-kit/zk-kit/tree/main/packages/lean-imt
- LeanIMT paper: https://zkkit.org/leanimt-paper.pdf
- Indexed Merkle Tree:
  https://docs.aztec.network/developers/docs/foundational-topics/advanced/storage/indexed_merkle_tree
