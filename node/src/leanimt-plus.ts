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
 * Indexed leaves have shape `{ value, nextIndex, nextValue }` and form a
 * sorted singly-linked list ordered by `value`. The underlying LeanIMT
 * stores the commitment `hash(value, nextValue)` at level 0; the rest of
 * the indexed-leaf record lives in a parallel array.
 *
 * The tree is empty at construction. On the first `insert(v)`, a sentinel
 * leaf `{ 0, 1, v }` is appended at index 0 together with the new leaf
 * `{ v, 0, 0 }` at index 1. The tail of the list is the leaf whose
 * `nextIndex` and `nextValue` are both `0` — the end-of-list marker.
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
     * sentinel is not included.
     *
     * Note that `nextIndex` fields refer to the underlying physical
     * positions used by the Merkle layout (where index 0 is the sentinel)
     * and are not meaningful as offsets into this array.
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
     * Replaces a value already in the tree with a different one,
     * preserving the sorted-list invariant.
     *
     * This is **not** the same as remove-then-insert: the physical Merkle
     * leaf at `oldValue`'s index is *repurposed* for `newValue`, so the
     * tree size and every other leaf's physical index are unchanged. Only
     * three commitments need to change — the predecessor of the old leaf,
     * the leaf itself, and the new predecessor (the new low leaf).
     *
     * Errors:
     *  - `oldValue === newValue`: no-op.
     *  - `oldValue` is not a member.
     *  - `newValue === zero` (reserved for the sentinel / end-of-list marker).
     *  - `newValue` is already a member of the tree.
     *
     * ### Algorithm
     *
     * Let `P` be the predecessor of the leaf that holds `oldValue` (the
     * leaf whose `nextIndex` points at it), and let `L` be the *new* low
     * leaf for `newValue` — the leaf such that `L.value < newValue` and
     * either `L.nextValue > newValue` or `L` is the tail. The physical
     * leaf holding `oldValue` is called `X`. We do:
     *
     *   1. Detach `X` from the list:    `P.next` → `X.next`
     *   2. Find `L` in the detached list (which now skips `X` entirely).
     *   3. Repurpose `X` for `newValue`: `X.value = newValue`, `X.next = L.next`
     *   4. Rewire `L` to point at `X`:  `L.next` → `X`
     *
     * If `P === L` (the new value lands in the same gap the old one was
     * removed from), step 4 simply overwrites the change made in step 1
     * with the correct final pointer; the result is still consistent.
     *
     * ### Worked example
     *
     * Suppose the tree currently contains `[10, 20, 30, 40]`. Physical
     * indices (from insertion order) might be `sentinel=0, 10@1, 20@2,
     * 30@3, 40@4`. Calling `update(20, 35)`:
     *
     * ```
     * Before:   sentinel → 10 → 20 → 30 → 40 → ⌀
     *                          (X=2)
     * Step 1 (detach X=2):
     *           sentinel → 10 → 30 → 40 → ⌀         (10's next now points to 30)
     *           20@2 is orphaned but still physically at index 2.
     *
     * Step 2: find low leaf for 35. Walk from sentinel → 10 → 30. 30's
     *         nextValue is 40, and 35 < 40, so L = 30 (lowIndex=3).
     *
     * Step 3 (repurpose X=2 for 35): leaf at index 2 becomes
     *         { value: 35, nextIndex: 4, nextValue: 40 }.
     *
     * Step 4 (rewire L=30 to point at X=2): leaf at index 3 becomes
     *         { value: 30, nextIndex: 2, nextValue: 35 }.
     *
     * After:    sentinel → 10 → 30 → 35 → 40 → ⌀
     *                              (X=2)
     * ```
     *
     * Three commitments changed (indices 1, 2, 3); index 4 (value 40)
     * was untouched. A single batched `_recompute` updates every Merkle
     * ancestor of those three indices exactly once.
     */
    public update(oldValue: N, newValue: N) {
        if (this._eq(oldValue, newValue)) return
        if (this._eq(newValue, this._zero)) throw new Error("Cannot update to the zero value")

        const physIndex = this.indexOf(oldValue)
        if (physIndex === -1) throw new Error("Value is not a member of the tree")
        if (this.has(newValue)) throw new Error("New value already exists in the tree")

        const oldLeaf = this._leaves[physIndex]
        const predIndex = this._findPredecessorIndex(physIndex)
        const pred = this._leaves[predIndex]

        // 1. Detach the old leaf: predecessor now skips over `physIndex`,
        //    pointing directly at whatever followed `oldValue`.
        this._writeLeaf(predIndex, {
            value: pred.value,
            nextIndex: oldLeaf.nextIndex,
            nextValue: oldLeaf.nextValue
        })

        // 2. Find the new low leaf for `newValue`. The walk starts at the
        //    sentinel and uses `nextIndex` pointers — since step 1 removed
        //    `physIndex` from that chain, the orphaned old leaf cannot be
        //    chosen as the low leaf even if its stale `value` would qualify.
        //    `lowIndex` may equal `predIndex` if the new value belongs in
        //    the same gap the old value was removed from.
        const lowIndex = this._findLowLeafIndex(newValue)
        const low = this._leaves[lowIndex]

        // 3. Reuse the physical leaf at `physIndex` for `newValue`,
        //    splicing it between `low` and whatever followed it. If `low`
        //    is the tail, the new leaf inherits the {0, 0} end-of-list
        //    marker and `physIndex` becomes the new tail.
        this._writeLeaf(physIndex, {
            value: newValue,
            nextIndex: low.nextIndex,
            nextValue: low.nextValue
        })

        // 4. Rewire the new low leaf to point at the repurposed leaf.
        //    When `lowIndex === predIndex` this overwrites step 1 with the
        //    correct final pointer — still consistent.
        this._writeLeaf(lowIndex, {
            value: low.value,
            nextIndex: physIndex,
            nextValue: newValue
        })

        // 5. Recompute every internal node above the (at most) three
        //    modified level-0 indices. The Set deduplicates the case
        //    `predIndex === lowIndex`, so each ancestor is hashed at most
        //    once even when the new value lands in the old value's slot.
        this._recompute(new Set([predIndex, physIndex, lowIndex]))
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
            leaves: { value: string; nextIndex: number; nextValue: string }[]
        }
        tree._nodes = parsed.nodes.map((level) => level.map(map))
        tree._leaves = parsed.leaves.map((l) => ({
            value: map(l.value),
            nextIndex: l.nextIndex,
            nextValue: map(l.nextValue)
        }))
        return tree
    }

    // ─── internals ────────────────────────────────────────────────────────

    private _eq(a: N, b: N): boolean {
        return !this._lt(a, b) && !this._lt(b, a)
    }

    /**
     * Walks the sorted linked list from the sentinel and returns the index
     * of the leaf `l` such that `l.value < v` and either `l.nextValue >= v`
     * or `l` is the tail. The returned leaf is the *low leaf* of `v`.
     *
     * Stops at `nextValue >= v` rather than strictly `>`, so the caller can
     * distinguish a strict gap from a duplicate.
     */
    private _findLowLeafIndex(v: N): number {
        let i = 0
        // Bounded for safety: the list cannot legitimately have more steps
        // than there are leaves. If it does, the invariants are broken.
        for (let step = 0; step < this._leaves.length; step += 1) {
            const cur = this._leaves[i]
            if (this._eq(cur.nextValue, this._zero)) return i // tail
            if (!this._lt(cur.nextValue, v)) return i
            i = cur.nextIndex
        }
        return i
    }

    /**
     * Returns the index of the leaf whose `nextIndex === target`. Linear
     * scan; assumes `target` is currently reachable from the sentinel.
     */
    private _findPredecessorIndex(target: number): number {
        for (let i = 0; i < this._leaves.length; i += 1) {
            if (this._leaves[i].nextIndex === target) return i
        }
        throw new Error(`No predecessor for leaf at index ${target}`)
    }

    /**
     * Stages a batch of inserts. For each value: splice into the linked
     * list and write its level-0 commitment(s) directly. Internal-node
     * recomputation is deferred to a single `_recompute` call so shared
     * ancestors are hashed at most once.
     */
    private _insertBatch(values: N[]) {
        const modifiedLeaves = new Set<number>()

        for (const v of values) {
            if (this._eq(v, this._zero)) throw new Error("Cannot insert the zero value")

            // First insert: append sentinel `{0, 1, v}` and first leaf `{v, 0, 0}`.
            if (this._leaves.length === 0) {
                this._appendLeaf({ value: this._zero, nextIndex: 1, nextValue: v }, modifiedLeaves)
                this._appendLeaf({ value: v, nextIndex: 0, nextValue: this._zero }, modifiedLeaves)
                continue
            }

            const lowIndex = this._findLowLeafIndex(v)
            const low = this._leaves[lowIndex]
            if (!this._eq(low.nextValue, this._zero) && this._eq(low.nextValue, v)) {
                throw new Error("Value already exists in the tree")
            }

            const newIndex = this._leaves.length

            // Splice the new leaf between `low` and `low.next`. If `low` is
            // the tail, the new leaf inherits the {0, 0} end-of-list marker.
            this._appendLeaf(
                { value: v, nextIndex: low.nextIndex, nextValue: low.nextValue },
                modifiedLeaves
            )
            this._writeLeaf(lowIndex, { value: low.value, nextIndex: newIndex, nextValue: v })
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
