import { OrderedIndex, OrderedIndexFactory } from "./ordered-index"

/**
 * AVL tree keyed by `N` with a `number` payload. Implements the
 * `OrderedIndex<N>` surface that LeanIMT+ depends on for predecessor
 * lookups.
 *
 * Worst-case `O(log n)` for `find`, `predecessor`, `insert`, and `remove`.
 * Tight height bound (`h ≤ 1.44 · log₂ n`) makes lookups faster than a
 * red-black tree of the same size, which matches LeanIMT+'s
 * proof-generation-heavy workload.
 *
 * The implementation is intentionally minimal: no parent pointers, no
 * iterators, no bulk APIs. It exists solely to back LeanIMT+'s predecessor
 * lookups and is not a general-purpose container.
 */
type AVLNode<N> = {
    key: N
    value: number
    height: number
    left: AVLNode<N> | null
    right: AVLNode<N> | null
}

export class AVLTree<N> implements OrderedIndex<N> {
    private _root: AVLNode<N> | null = null
    private _size = 0
    private readonly _lt: (a: N, b: N) => boolean

    constructor(lt: (a: N, b: N) => boolean) {
        this._lt = lt
    }

    get size(): number {
        return this._size
    }

    find(key: N): number | null {
        let n = this._root
        while (n !== null) {
            if (this._lt(key, n.key)) n = n.left
            else if (this._lt(n.key, key)) n = n.right
            else return n.value
        }
        return null
    }

    predecessor(key: N): number | null {
        let n = this._root
        let best: AVLNode<N> | null = null
        while (n !== null) {
            if (this._lt(n.key, key)) {
                best = n
                n = n.right
            } else {
                n = n.left
            }
        }
        return best === null ? null : best.value
    }

    insert(key: N, value: number) {
        const before = this._size
        this._root = this._insert(this._root, key, value)
        if (this._size === before) {
            throw new Error("AVL: duplicate key on insert")
        }
    }

    remove(key: N) {
        const before = this._size
        this._root = this._remove(this._root, key)
        if (this._size === before) {
            throw new Error("AVL: key not found on remove")
        }
    }

    private _insert(node: AVLNode<N> | null, key: N, value: number): AVLNode<N> {
        if (node === null) {
            this._size += 1
            return { key, value, height: 1, left: null, right: null }
        }
        if (this._lt(key, node.key)) node.left = this._insert(node.left, key, value)
        else if (this._lt(node.key, key)) node.right = this._insert(node.right, key, value)
        else return node // duplicate, caller detects via size check
        return this._rebalance(node)
    }

    private _remove(node: AVLNode<N> | null, key: N): AVLNode<N> | null {
        if (node === null) return null
        if (this._lt(key, node.key)) node.left = this._remove(node.left, key)
        else if (this._lt(node.key, key)) node.right = this._remove(node.right, key)
        else {
            this._size -= 1
            if (node.left === null) return node.right
            if (node.right === null) return node.left
            // Two children: splice in the in-order successor.
            let succ = node.right
            while (succ.left !== null) succ = succ.left
            node.key = succ.key
            node.value = succ.value
            this._size += 1 // counter the upcoming decrement inside the recursive remove
            node.right = this._remove(node.right, succ.key)
        }
        return this._rebalance(node)
    }

    private _rebalance(node: AVLNode<N>): AVLNode<N> {
        this._updateHeight(node)
        const bf = this._balanceFactor(node)
        if (bf > 1) {
            if (this._balanceFactor(node.left!) < 0) node.left = this._rotateLeft(node.left!)
            return this._rotateRight(node)
        }
        if (bf < -1) {
            if (this._balanceFactor(node.right!) > 0) node.right = this._rotateRight(node.right!)
            return this._rotateLeft(node)
        }
        return node
    }

    private _height(node: AVLNode<N> | null): number {
        return node === null ? 0 : node.height
    }

    private _updateHeight(node: AVLNode<N>) {
        const lh = this._height(node.left)
        const rh = this._height(node.right)
        node.height = 1 + (lh > rh ? lh : rh)
    }

    private _balanceFactor(node: AVLNode<N>): number {
        return this._height(node.left) - this._height(node.right)
    }

    private _rotateLeft(node: AVLNode<N>): AVLNode<N> {
        const r = node.right!
        node.right = r.left
        r.left = node
        this._updateHeight(node)
        this._updateHeight(r)
        return r
    }

    private _rotateRight(node: AVLNode<N>): AVLNode<N> {
        const l = node.left!
        node.left = l.right
        l.right = node
        this._updateHeight(node)
        this._updateHeight(l)
        return l
    }
}

/** Default factory: AVL-backed ordered index. */
export const avlFactory: OrderedIndexFactory<unknown> = ((lt: (a: unknown, b: unknown) => boolean) =>
    new AVLTree<unknown>(lt)) as OrderedIndexFactory<unknown>
