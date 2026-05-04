import { LeanIMTPlus, LeanIMTPlusProof } from "../../browser/LeanIMTPlus/src"
import { poseidon2 } from "poseidon-lite"

const poseidon = (a: bigint, b: bigint) => poseidon2([a, b])

const newTree = () => new LeanIMTPlus<bigint>(poseidon)

describe("LeanIMTPlus", () => {
    describe("construction", () => {
        it("starts empty", () => {
            const t = newTree()
            expect(t.size).toBe(0)
            expect(t.depth).toBe(0)
            expect(t.leaves).toEqual([])
        })

        it("constructor accepts initial values", () => {
            const t = new LeanIMTPlus<bigint>(poseidon, [10n, 20n, 5n])
            expect(t.size).toBe(3)
            expect(t.has(10n) && t.has(20n) && t.has(5n)).toBe(true)
            expect(leafValues(t)).toEqual(new Set([5n, 10n, 20n]))
        })

        it("rejects a non-function hash", () => {
            expect(() => new LeanIMTPlus<bigint>(undefined as never)).toThrow()
        })
    })

    describe("first insert", () => {
        it("exposes a single user leaf (sentinel is internal)", () => {
            const t = newTree()
            t.insert(42n)

            expect(t.size).toBe(1)
            expect(t.leaves).toHaveLength(1)
            expect(t.leaves[0].value).toBe(42n)
            // The first inserted value is also the tail: nextValue is the
            // end-of-list marker (zero).
            expect(t.leaves[0].nextValue).toBe(0n)
            expect(leafValues(t)).toEqual(new Set([42n]))
        })
    })

    describe("insert", () => {
        it("maintains sorted order across arbitrary insertion order", () => {
            const t = newTree()
            for (const v of [50n, 10n, 30n, 70n, 20n, 60n, 40n]) t.insert(v)

            expect(leafValues(t)).toEqual(new Set([10n, 20n, 30n, 40n, 50n, 60n, 70n]))

            // The largest value is the tail — its nextValue is the end-of-list marker.
            const tail = t.leaves.find((l) => l.value === 70n)!
            expect(tail.nextValue).toBe(0n)
        })

        it("throws on the zero value", () => {
            const t = newTree()
            expect(() => t.insert(0n)).toThrow(/zero/i)
        })

        it("throws on a duplicate value", () => {
            const t = newTree()
            t.insert(7n)
            expect(() => t.insert(7n)).toThrow(/already exists/i)
        })

        it("indexOf and has skip the sentinel", () => {
            const t = newTree()
            t.insert(99n)
            expect(t.indexOf(0n)).toBe(-1)
            expect(t.has(0n)).toBe(false)
            expect(t.indexOf(99n)).toBe(1)
            expect(t.has(99n)).toBe(true)
            expect(t.indexOf(123n)).toBe(-1)
        })
    })

    describe("insertMany", () => {
        it("produces the same root as a sequence of single inserts", () => {
            const values = [11n, 7n, 25n, 3n, 18n, 50n, 42n]
            const a = newTree()
            for (const v of values) a.insert(v)
            const b = newTree()
            b.insertMany(values)
            expect(b.root).toBe(a.root)
            expect(b.leaves).toEqual(a.leaves)
        })

        it("throws on an empty input", () => {
            expect(() => newTree().insertMany([])).toThrow()
        })

        it("throws on a duplicate inside the batch", () => {
            expect(() => newTree().insertMany([3n, 5n, 3n])).toThrow(/already exists/i)
        })
    })

    describe("generateProof / verifyProof", () => {
        let tree: LeanIMTPlus<bigint>
        beforeEach(() => {
            tree = newTree()
            tree.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
        })

        it("returns a membership proof for inserted values", () => {
            const p = tree.generateProof(25n)
            expect(p.proofType).toBe(0)
            expect(p.value).toBe(25n)
            expect(p.leaf.value).toBe(25n)
            expect(tree.verifyProof(p)).toBe(true)
            expect(LeanIMTPlus.verifyProof(p, poseidon)).toBe(true)
        })

        it("returns a non-membership proof for absent values", () => {
            const cases: { v: bigint; lowValue: bigint; lowNext: bigint }[] = [
                { v: 1n, lowValue: 0n, lowNext: 3n }, // sentinel as low
                { v: 20n, lowValue: 18n, lowNext: 25n }, // strictly between
                { v: 100n, lowValue: 41n, lowNext: 0n } // tail as low
            ]
            for (const { v, lowValue, lowNext } of cases) {
                const p = tree.generateProof(v)
                expect(p.proofType).toBe(1)
                expect(p.value).toBe(v)
                expect(p.leaf.value).toBe(lowValue)
                expect(p.leaf.nextValue).toBe(lowNext)
                expect(tree.verifyProof(p)).toBe(true)
                expect(LeanIMTPlus.verifyProof(p, poseidon)).toBe(true)
            }
        })

        it("rejects a tampered membership proof", () => {
            const p = tree.generateProof(10n)
            const bad: LeanIMTPlusProof<bigint> = { ...p, leaf: { ...p.leaf, value: 11n } }
            expect(tree.verifyProof(bad)).toBe(false)
        })

        it("rejects a forged non-membership proof claiming a member is absent", () => {
            const p = tree.generateProof(20n)
            const forged: LeanIMTPlusProof<bigint> = { ...p, value: 18n } // 18 is a real member
            expect(tree.verifyProof(forged)).toBe(false)
        })

        it("rejects a non-membership proof with mismatched lowLeaf.nextValue", () => {
            const p = tree.generateProof(20n)
            const bad: LeanIMTPlusProof<bigint> = { ...p, leaf: { ...p.leaf, nextValue: 21n } }
            expect(tree.verifyProof(bad)).toBe(false)
        })

        it("rejects a membership proof whose proofType was flipped", () => {
            const p = tree.generateProof(10n)
            const flipped: LeanIMTPlusProof<bigint> = { ...p, proofType: 1 }
            // 10 == leaf.value, so the lt(leaf.value, value) check fails.
            expect(tree.verifyProof(flipped)).toBe(false)
        })

        it("throws on zero or empty tree", () => {
            expect(() => tree.generateProof(0n)).toThrow(/sentinel/i)
            expect(() => newTree().generateProof(5n)).toThrow(/empty/i)
        })
    })

    describe("export / import", () => {
        it("roundtrips through JSON", () => {
            const a = newTree()
            a.insertMany([15n, 4n, 22n, 8n, 100n])
            const b = LeanIMTPlus.import<bigint>(poseidon, a.export())

            expect(b.root).toBe(a.root)
            expect(b.leaves).toEqual(a.leaves)
            expect(b.verifyProof(b.generateProof(22n))).toBe(true)
            expect(b.verifyProof(b.generateProof(50n))).toBe(true)
        })

        it("preserves the ability to insert further", () => {
            const a = newTree()
            a.insertMany([1n, 2n, 3n])
            const b = LeanIMTPlus.import<bigint>(poseidon, a.export())
            a.insert(100n)
            b.insert(100n)
            expect(b.root).toBe(a.root)
        })
    })

    describe("custom N type", () => {
        it("works with `number`", () => {
            const numHash = (a: number, b: number) => {
                let h = (a * 2654435761) ^ (b * 40503)
                h = (h ^ (h >>> 16)) >>> 0
                return h
            }
            const t = new LeanIMTPlus<number>(numHash, [], 0, (a, b) => a < b)
            t.insertMany([5, 3, 9, 1])
            expect(t.has(3)).toBe(true)
            const m = t.generateProof(9)
            expect(m.proofType).toBe(0)
            expect(t.verifyProof(m)).toBe(true)
            const nm = t.generateProof(7)
            expect(nm.proofType).toBe(1)
            expect(t.verifyProof(nm)).toBe(true)
        })
    })
})

/** Returns user-inserted values in ascending order. */
/** Returns the set of user-inserted leaf values; order is irrelevant for assertions. */
function leafValues<N>(tree: LeanIMTPlus<N>): Set<N> {
    return new Set(tree.leaves.map((l) => l.value))
}

