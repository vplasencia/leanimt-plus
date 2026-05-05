# LeanIMT+

LeanIMT+ is an optimized Incremental Merkle Tree designed to support efficient
membership **and non-membership** proofs.

Inspired by:

- LeanIMT (https://zkkit.org/leanimt-paper.pdf)
- Indexed Merkle Tree (https://eprint.iacr.org/2021/1263.pdf)(https://docs.aztec.network/developers/docs/foundational-topics/advanced/storage/indexed_merkle_tree)

The result is a simple structure that allows:

- Efficient incremental insertions
- Compact membership proofs
- Efficient non-membership proofs
- Post-quantum safety (assuming the underlying hash function is post-quantum secure)

## Motivation

Traditional Merkle trees are efficient for membership proofs but do not
natively support non-membership proofs. LeanIMT is fast and append-only
but, like a plain Merkle tree, can only prove inclusion.

LeanIMT+ borrows the *indexed leaf* idea from the Indexed Merkle Tree
(each leaf stores a pointer to the next-larger value, forming a sorted
linked list embedded in the tree) and combines it with the LeanIMT
construction so the tree depth stays dynamic and no zero hashes are
needed.

## Overview

LeanIMT+ is a sorted incremental Merkle tree where:

- Leaves are linked together in **sorted order** by `value`.
- Each leaf stores two fields: `(value, nextValue)`. The "next" pointer
  is *implicit*: a leaf with `nextValue = v` logically points to the
  leaf whose `value = v`.
- Each leaf commits to its data as `leafHash = H(value, nextValue)`.
- The base layer of the tree is the list of these `leafHash` values.
- Parent nodes follow the LeanIMT construction: `parent = H(left, right)`.
  When a level has an odd number of nodes, the unpaired node is promoted
  unchanged to the next level (no zero hash, no extra hash call).

Rules:

- `0` is **not** a valid value.
- `0` is used only as a sentinel and as the end-of-list marker.
- The last leaf in the linked list always has `nextValue = 0` (the
  end-of-list marker).

## Sentinel Leaf

The first leaf in the tree is always a sentinel:

```
value     = 0
nextValue = (smallest user value)
```

The sentinel is created together with the first user insertion. It
allows non-membership proofs for any value smaller than the smallest
user value.

Example after inserting `5, 10, 20`:

```
sentinel        first              middle          tail
(value, next)   (value, next)      (value, next)   (value, next)
[0, 5]          [5, 10]            [10, 20]        [20, 0]
```

## Construction

1. Each leaf commits to its data: `leafHash = H(value, nextValue)`.

2. These hashes form the base layer of the tree.

3. Parent nodes follow the LeanIMT construction:
   `parent = H(leftChild, rightChild)`. Unpaired nodes are promoted
   unchanged.

This produces the final Merkle root.

<!-- Diagram placeholder: tree construction -->
![SortedIMT](images/leanimt-plus.png)

## Insertion

To insert a new value `v`:

1. **Locate the low leaf**

   Walk the linked list starting at the sentinel to find the leaf `L`
   such that `L.value < v` and either `L.nextValue > v` or `L` is the
   tail.

2. **Append the new leaf**

   Append a new leaf at the next physical index. The new leaf inherits
   `L`'s old `nextValue`:

   ```
   newLeaf = { value: v, nextValue: L.nextValue }
   ```

3. **Rewire the low leaf**

   Update `L` so it points at the new value:

   ```
   L.nextValue = v
   ```

4. **Recompute hashes**

   Recompute:
   - the new leaf's hash
   - the low leaf's hash (it changed)
   - all parent hashes up to the root that depend on these two leaves

Example, inserting `7` into a tree containing `5, 10`:

```
before
[0, 5] [5, 10] [10, 0]

insert 7

after
[0, 5] [5, 7] [10, 0] [7, 10]
```

(The new leaf is appended at the end *physically*, but logically sits
between `5` and `10` in the sorted linked list.)

<!-- Diagram placeholder: insertion -->

## Membership Proof

To prove that value `v` **is** in the tree:

1. Walk the linked list to locate the leaf containing `value = v`.

2. Generate a standard Merkle proof for that leaf using the LeanIMT
   structure.

The verifier checks:

- The leaf's hash equals `H(leaf.value, leaf.nextValue)`.
- The Merkle path reconstructs the root.
- `leaf.value === v`.

<!-- Diagram placeholder: membership proof -->

## Non-Membership Proof

To prove that value `v` is **not** in the tree:

1. **Find the low leaf**

   Walk the linked list to find the leaf `L` such that `L.value < v`
   and either `L.nextValue > v` or `L` is the tail (`L.nextValue = 0`).

2. **Generate a Merkle proof for `L`**

   Same shape as a membership proof, but the proof is for `L`, not for
   `v` itself.

3. **Verifier checks**

   The verifier validates:

   - The Merkle proof of `H(L.value, L.nextValue)` against the root.
   - The ordering condition: `L.value < v` AND
     (`L.nextValue > v` OR `L.nextValue = 0`).

   If both hold, `v` cannot exist in the tree without breaking the
   sorted-list invariant.

<!-- Diagram placeholder: non-membership proof -->

## Implementation

The reference implementation of LeanIMT+ is available in this repository
at [browser/LeanIMTPlus](./browser/LeanIMTPlus). Usage documentation
lives in [node/USAGE.md](./node/USAGE.md).

The implementation includes:

- LeanIMT+ data structure
- Incremental insertion (single and batched)
- Unified proof generation (membership and non-membership)
- Unified proof verification
- Export / import of the full tree state

## Project Layout

```
leanimt-plus/
├── browser/                # Next.js demo app + reference implementation
│   └── LeanIMTPlus/src/    # Single source of truth for the data structure
└── node/                   # Jest test suite + usage docs
    └── tests/              # Imports directly from ../../browser/LeanIMTPlus/src
```

## Related Constructions

LeanIMT+ is one point in the design space of "Merkle trees that support
non-membership proofs". Related constructions worth comparing:

- **LeanIMT**: fast and append-only; supports only membership proofs.
- **Indexed Merkle Tree**: uses the indexed-leaf trick for non-membership;
  fixed depth.
- **Sorted IMT**: keeps leaves in sorted order rather than insertion
  order, requiring shifts on insert.
- **LeanIMT + sorted-leaves index**: adds an external sorted index over
  insertion-ordered leaves to speed up predecessor queries.
