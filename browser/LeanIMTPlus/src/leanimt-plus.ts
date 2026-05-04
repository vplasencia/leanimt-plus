import { LeanIMTPlusHashFunction, LeanIMTPlusLeaf, LeanIMTPlusProof, LeanIMTPlusProofType } from "./types"

/**
 * Default zero element used when `N = bigint`. Cast lazily at the use site
 * so the class stays generic over `N` without forcing every consumer to
 * provide their own zero.
 */
const DEFAULT_ZERO: unknown = BigInt(0)

/**
 * Default strict less-than comparator for `N = bigint`.
 */
const DEFAULT_LT: (a: unknown, b: unknown) => boolean = (a, b) => (a as bigint) < (b as bigint)

/**
 * LeanIMT+ — a LeanIMT extended with non-membership proofs by adopting the
 * indexed-leaf design from the Indexed Merkle Tree.
 *
 * Indexed leaves have shape `{ value, nextValue }` and form an *implicit*
 * sorted linked list: a leaf with `nextValue = v` logically points to
 * the leaf whose `value = v`. The underlying LeanIMT stores the commitment
 * `hash(value, nextValue)` at level 0; the rest of the indexed-leaf record
 * lives in a parallel array.
 *
 * The tree is empty at construction. On the first `insert(v)`, a sentinel
 * leaf `{ 0, v }` is appended at index 0 together with the new leaf
 * `{ v, 0 }` at index 1. The tail of the list is the leaf whose
 * `nextValue` is `0` — the end-of-list marker.
 */
export default class LeanIMTPlus<N = bigint> {
    /** Levels of the underlying LeanIMT. `_nodes[0]` holds leaf commitments. */
    private _nodes: N[][]

    /** Indexed-leaf records, parallel to `_nodes[0]`. */
    private _leaves: LeanIMTPlusLeaf<N>[]

    private readonly _hash: LeanIMTPlusHashFunction<N>
    private readonly _zero: N
    private readonly _lt: (a: N, b: N) => boolean

    /**
     * @param hash Hash function used for both internal nodes and leaf commitments.
     * @param values Optional list of initial values to insert.
     * @param zero Zero element of `N` (defaults to `0n`). Reserved for the sentinel and end-of-list marker.
     * @param lt   Strict less-than comparator (defaults to native `<`).
     */
    constructor(
        hash: LeanIMTPlusHashFunction<N>,
        values: N[] = [],
        zero: N = DEFAULT_ZERO as N,
        lt: (a: N, b: N) => boolean = DEFAULT_LT as (a: N, b: N) => boolean
    ) {
        if (typeof hash !== "function") throw new TypeError("hash must be a function")

        this._hash = hash
        this._zero = zero
        this._lt = lt
        this._nodes = [[]]
        this._leaves = []

        if (values.length > 0) this.insertMany(values)
    }

    public get root(): N {
        return this._nodes[this.depth][0]
    }

    public get depth(): number {
        return this._nodes.length - 1
    }

    /** Number of user-inserted values. Excludes the internal sentinel. */
    public get size(): number {
        return this._leaves.length === 0 ? 0 : this._leaves.length - 1
    }

    /**
     * Defensive copy of the user-inserted indexed leaves. The internal
     * sentinel is not included. Order is the physical insertion order,
     * not the sorted order.
     */
    public get leaves(): LeanIMTPlusLeaf<N>[] {
        return this._leaves.length === 0 ? [] : this._leaves.slice(1).map((l) => ({ ...l }))
    }

    /**
     * Returns the index of the leaf whose `value` equals `v`, or -1 if
     * absent. The sentinel's value (`zero`) is never reported as a member.
     */
    public indexOf(v: N): number {
        if (this._eq(v, this._zero)) return -1
        // Skip the sentinel at index 0; its value is `zero` by construction.
        for (let i = 1; i < this._leaves.length; i += 1) {
            if (this._eq(this._leaves[i].value, v)) return i
        }
        return -1
    }

    public has(v: N): boolean {
        return this.indexOf(v) !== -1
    }

    /** Inserts `v`. Throws if `v` is `zero` or already present. */
    public insert(v: N) {
        this._insertBatch([v])
    }

    /**
     * Inserts each value in order. More efficient than calling `insert` N
     * times because each affected internal node is rehashed at most once
     * even when several inserts share ancestors.
     */
    public insertMany(values: N[]) {
        if (values.length === 0) throw new Error("There are no values to add")
        this._insertBatch(values)
    }

    /**
     * Generates a proof for `value`. Returns a membership proof
     * (`proofType: 0`) if `value` is in the tree, or a non-membership
     * proof (`proofType: 1`) otherwise. Throws if the tree is empty or
     * `value === zero`.
     */
    public generateProof(value: N): LeanIMTPlusProof<N> {
        if (this._eq(value, this._zero)) throw new Error("zero is reserved for the sentinel")
        if (this._leaves.length === 0) throw new Error("Tree is empty")

        const idx = this.indexOf(value)
        if (idx !== -1) return this._buildProof(0, value, idx)
        return this._buildProof(1, value, this._findLowLeafIndex(value))
    }

    public verifyProof(proof: LeanIMTPlusProof<N>): boolean {
        return LeanIMTPlus.verifyProof(proof, this._hash, this._zero, this._lt)
    }

    public static verifyProof<N>(
        proof: LeanIMTPlusProof<N>,
        hash: LeanIMTPlusHashFunction<N>,
        zero: N = DEFAULT_ZERO as N,
        lt: (a: N, b: N) => boolean = DEFAULT_LT as (a: N, b: N) => boolean
    ): boolean {
        const { proofType, root, value, leaf, leafIndex, siblings } = proof
        const eq = (a: N, b: N) => !lt(a, b) && !lt(b, a)

        if (proofType === 0) {
            if (!eq(leaf.value, value)) return false
        } else {
            // Low-leaf check: leaf.value < value < leaf.nextValue (or tail).
            if (!lt(leaf.value, value)) return false
            const isTail = eq(leaf.nextValue, zero)
            if (!isTail && !lt(value, leaf.nextValue)) return false
        }

        const commitment = hash(leaf.value, leaf.nextValue)
        return walkPath(commitment, leafIndex, siblings, hash) === root
    }

    /**
     * Serializes the full tree state. `bigint` values are written as
     * decimal strings.
     */
    public export(): string {
        return JSON.stringify(
            { nodes: this._nodes, leaves: this._leaves },
            (_, v) => (typeof v === "bigint" ? v.toString() : v)
        )
    }

    public static import<N = bigint>(
        hash: LeanIMTPlusHashFunction<N>,
        data: string,
        zero: N = DEFAULT_ZERO as N,
        lt: (a: N, b: N) => boolean = DEFAULT_LT as (a: N, b: N) => boolean,
        map: (value: string) => N = (s) => BigInt(s) as unknown as N
    ): LeanIMTPlus<N> {
        const tree = new LeanIMTPlus<N>(hash, [], zero, lt)
        const parsed = JSON.parse(data) as {
            nodes: string[][]
            leaves: { value: string; nextValue: string }[]
        }
        tree._nodes = parsed.nodes.map((level) => level.map(map))
        tree._leaves = parsed.leaves.map((l) => ({
            value: map(l.value),
            nextValue: map(l.nextValue)
        }))
        return tree
    }

    // ─── internals ────────────────────────────────────────────────────────

    private _eq(a: N, b: N): boolean {
        return !this._lt(a, b) && !this._lt(b, a)
    }

    /**
     * Returns the physical index of the *low leaf* of `v` — the leaf `L`
     * such that `L.value < v` and either `L.nextValue > v` or `L` is the
     * tail (`L.nextValue === 0`). With the implicit linked list, that
     * leaf is also `v`'s predecessor.
     *
     * Single linear scan over the physical leaf array. If a leaf with
     * `nextValue === v` exists, returns its index regardless: the caller
     * inspects `low.nextValue` to detect duplicates.
     */
    private _findLowLeafIndex(v: N): number {
        for (let i = 0; i < this._leaves.length; i += 1) {
            const cur = this._leaves[i]
            if (!this._lt(cur.value, v)) continue
            const isTail = this._eq(cur.nextValue, this._zero)
            if (isTail || !this._lt(cur.nextValue, v)) return i
        }
        throw new Error("invariant violated: no low leaf for the requested value")
    }

    /**
     * Stages a batch of inserts. For each value: splice into the implicit
     * linked list and write its level-0 commitment(s) directly. Internal-
     * node recomputation is deferred to a single `_recompute` call so
     * shared ancestors are hashed at most once.
     */
    private _insertBatch(values: N[]) {
        const modifiedLeaves = new Set<number>()

        for (const v of values) {
            if (this._eq(v, this._zero)) throw new Error("Cannot insert the zero value")

            // First insert: append sentinel `{0, v}` and first leaf `{v, 0}`.
            if (this._leaves.length === 0) {
                this._appendLeaf({ value: this._zero, nextValue: v }, modifiedLeaves)
                this._appendLeaf({ value: v, nextValue: this._zero }, modifiedLeaves)
                continue
            }

            const lowIndex = this._findLowLeafIndex(v)
            const low = this._leaves[lowIndex]
            if (!this._eq(low.nextValue, this._zero) && this._eq(low.nextValue, v)) {
                throw new Error("Value already exists in the tree")
            }

            // Splice the new leaf between `low` and whatever `low` pointed to.
            // The new leaf inherits `low.nextValue` (which is `0` if `low`
            // is the tail), and `low` is rewired to point at `v`.
            this._appendLeaf({ value: v, nextValue: low.nextValue }, modifiedLeaves)
            this._writeLeaf(lowIndex, { value: low.value, nextValue: v })
            modifiedLeaves.add(lowIndex)
        }

        this._recompute(modifiedLeaves)
    }

    /**
     * Writes a leaf at `index`, refreshing its level-0 commitment. Does
     * NOT recompute internal nodes — the caller batches that via
     * `_recompute`.
     */
    private _writeLeaf(index: number, leaf: LeanIMTPlusLeaf<N>) {
        this._leaves[index] = leaf
        this._nodes[0][index] = this._hash(leaf.value, leaf.nextValue)
    }

    /** Appends a new leaf and records its index in `modifiedLeaves`. */
    private _appendLeaf(leaf: LeanIMTPlusLeaf<N>, modifiedLeaves: Set<number>) {
        const index = this._leaves.length
        this._leaves.push(leaf)
        this._nodes[0].push(this._hash(leaf.value, leaf.nextValue))
        modifiedLeaves.add(index)
    }

    /**
     * Walks the modified-leaf indices up the tree, hashing each affected
     * internal node exactly once. Grows the tree depth if needed.
     */
    private _recompute(modifiedLeaves: Set<number>) {
        const size = this._nodes[0].length
        const targetDepth = size <= 1 ? 0 : Math.ceil(Math.log2(size))
        while (this.depth < targetDepth) this._nodes.push([])

        if (this.depth === 0) return // root is _nodes[0][0]; nothing to walk.

        let modified = new Set<number>()
        for (const i of modifiedLeaves) modified.add(i >> 1)

        for (let level = 1; level <= this.depth; level += 1) {
            const next = new Set<number>()
            for (const idx of modified) {
                const left = this._nodes[level - 1][2 * idx]
                const right = this._nodes[level - 1][2 * idx + 1]
                this._nodes[level][idx] = right !== undefined ? this._hash(left, right) : left
                next.add(idx >> 1)
            }
            modified = next
        }
    }

    /**
     * Builds a proof for the leaf at level-0 index `physIndex`, walking
     * the Merkle path and packing the path bits into `leafIndex`.
     */
    private _buildProof(proofType: LeanIMTPlusProofType, value: N, physIndex: number): LeanIMTPlusProof<N> {
        if (physIndex < 0 || physIndex >= this._leaves.length) {
            throw new Error(`The leaf at index '${physIndex}' does not exist in this tree`)
        }

        const leaf = { ...this._leaves[physIndex] }
        const siblings: N[] = []
        const path: number[] = []

        let i = physIndex
        for (let level = 0; level < this.depth; level += 1) {
            const isRight = i & 1
            const sibling = this._nodes[level][isRight ? i - 1 : i + 1]
            // Skip missing right siblings — at those levels the parent is
            // just the left child, so there is no hash to encode.
            if (sibling !== undefined) {
                path.push(isRight)
                siblings.push(sibling)
            }
            i >>= 1
        }

        return {
            proofType,
            root: this.root,
            value,
            leaf,
            leafIndex: path.length === 0 ? 0 : Number.parseInt(path.reverse().join(""), 2),
            siblings
        }
    }
}

/** Walks a Merkle path from `leaf` to the root using packed `index` bits. */
function walkPath<N>(leaf: N, index: number, siblings: N[], hash: LeanIMTPlusHashFunction<N>): N {
    let node = leaf
    for (let i = 0; i < siblings.length; i += 1) {
        node = ((index >> i) & 1) === 1 ? hash(siblings[i], node) : hash(node, siblings[i])
    }
    return node
}
