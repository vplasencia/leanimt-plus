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
tree.update(7n, 8n) // replace 7 with 8

console.log(tree.root)
console.log(tree.size)   // 5  (sentinel + 4 values)

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
{ value, nextIndex, nextValue }
```

The leaves form a sorted singly-linked list over `value`. The *commitment*
of the leaf — what is actually stored at level 0 of the underlying
LeanIMT — is `hash(value, nextValue)`. The `commitment` is **not** stored
on the record itself; it is derivable.

### Sentinel

The tree starts empty. On the first `insert(v)`, two leaves are appended
together:

| Index | value | nextIndex | nextValue |
|------:|------:|----------:|----------:|
| 0 (sentinel)  | `0` | `1` | `v` |
| 1 (first leaf)| `v` | `0` | `0` |

The **tail** of the list is always the leaf whose `nextIndex === 0` and
`nextValue === 0` — the end-of-list marker.

Every subsequent `insert(v)`:

1. Walks the linked list to find the **low leaf** `L`
   such that `L.value < v` and either `L.nextValue > v` or `L` is the tail.
2. Splices a new leaf between `L` and the leaf `L` previously pointed to.
3. Rewires `L` to point at the new leaf.
4. Recomputes only the affected Merkle ancestors.

### Update

`update(oldValue, newValue)` replaces an existing value with a different
one. The crucial property is that this is **not** the same as
remove-then-insert: the *physical* Merkle leaf that previously held
`oldValue` is repurposed for `newValue`, so the tree size and every
other leaf's physical index stay the same. Only three level-0
commitments change — the predecessor of the old leaf, the leaf itself,
and the new low leaf for the new value.

Let `X` be the physical leaf holding `oldValue`, `P` be its predecessor
in the linked list, and `L` be the *new* low leaf for `newValue` (the
leaf such that `L.value < newValue` and either `L.nextValue > newValue`
or `L` is the tail). The algorithm:

1. **Detach `X`:** rewire `P` so its `next` pointer skips `X`.
2. **Find `L`:** walk the now-detached list to locate the new low leaf.
3. **Repurpose `X`:** set `X.value = newValue`, with `X.next` taken from
   `L`'s old `next`.
4. **Rewire `L`:** point `L.next` at `X`.

If `P === L` (the new value lands in the same gap the old one vacated),
step 4 simply overwrites step 1 with the correct final pointer; the
result is still consistent.

#### Worked example

Starting state — tree contains `[10, 20, 30, 40]` with physical indices
`{ sentinel: 0, 10: 1, 20: 2, 30: 3, 40: 4 }`. Calling `update(20, 35)`:

```
Before:  sentinel → 10 → 20 → 30 → 40 → ⌀
                        (X=2)

Step 1 — detach X=2:
         sentinel → 10 → 30 → 40 → ⌀         (10.next now points to 30)
         20@2 is orphaned but still physically at index 2.

Step 2 — find low leaf for 35: 30.nextValue = 40, 35 < 40, so L = 30
         (lowIndex = 3).

Step 3 — repurpose X=2 for 35:
         leaf[2] = { value: 35, nextIndex: 4, nextValue: 40 }

Step 4 — rewire L=30 to point at X=2:
         leaf[3] = { value: 30, nextIndex: 2, nextValue: 35 }

After:   sentinel → 10 → 30 → 35 → 40 → ⌀
                            (X=2)
```

Three commitments changed (indices 1, 2, 3); index 4 (value 40) was
untouched. A single batched recomputation updates every affected Merkle
ancestor exactly once.

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
| `leaves` | `LeanIMTPlusLeaf<N>[]` | Defensive copy of the user-inserted indexed leaves. The internal sentinel is **not** included. The `nextIndex` field refers to the underlying physical positions used by the Merkle layout (where index 0 is the sentinel) and is not a meaningful offset into this array. |

### Methods

#### `insert(v: N)`

Insert `v`. Throws if `v === zero` or if `v` is already a member.

#### `insertMany(values: N[])`

Insert each value in order. Prefer over a loop of `insert` calls when
adding many values at once: each affected internal node is rehashed at
most once even when several inserts share ancestors. Throws on an empty
array, on `zero`, or on duplicates.

#### `update(oldValue: N, newValue: N)`

Replace `oldValue` with `newValue`, preserving the sorted-list invariant.
A no-op when `oldValue === newValue`. Throws if `oldValue` is not a
member, if `newValue === zero`, or if `newValue` is already a member.

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
  end-of-list marker. `insert` and `update` throw.
- **Linear scans.** `indexOf`, `has`, the low-leaf walk, and
  `update`'s predecessor lookup are all O(n). Proof *generation* is
  therefore O(n + log n); proof *verification* is O(log n).
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
