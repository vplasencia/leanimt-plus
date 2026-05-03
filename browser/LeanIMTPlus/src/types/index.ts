/**
 * Hash function used to compute internal nodes of the tree.
 * In LeanIMT+, the same function is also used to compute leaf commitments
 * `commitment = hash(value, nextValue)`, which are the values stored at
 * level 0 of the underlying LeanIMT.
 */
export type LeanIMTPlusHashFunction<N = bigint> = (a: N, b: N) => N

/**
 * An indexed leaf of LeanIMT+. The level-0 commitment for this leaf is
 * `hash(value, nextValue)` and is stored implicitly in the LeanIMT,
 * not on the record itself.
 */
export type LeanIMTPlusLeaf<N = bigint> = {
    value: N
    nextIndex: number
    nextValue: N
}

/**
 * Discriminator for `LeanIMTPlusProof`. Encoded as `0 | 1` rather than a
 * string union so it is cheap to pass through ZK circuits and binary
 * serializers.
 *  - `0` (membership): `leaf.value === value`.
 *  - `1` (non-membership): `leaf` is the *low leaf* of `value` —
 *    `leaf.value < value` and either `leaf.nextValue > value` or
 *    `leaf.nextValue === 0` (tail).
 */
export type LeanIMTPlusProofType = 0 | 1

/**
 * Unified proof type. The `leaf` field together with `leafIndex` and
 * `siblings` is a standard Merkle proof of `hash(leaf.value, leaf.nextValue)`
 * against `root`. The `proofType` tells the verifier which extra check to run.
 */
export type LeanIMTPlusProof<N = bigint> = {
    proofType: LeanIMTPlusProofType
    root: N
    /** The value being asserted (in)existent. For membership this equals `leaf.value`. */
    value: N
    leaf: LeanIMTPlusLeaf<N>
    leafIndex: number
    siblings: N[]
}
