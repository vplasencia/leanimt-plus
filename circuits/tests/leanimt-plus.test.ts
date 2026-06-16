import { assert } from "chai"
import { describe } from "mocha"
import { LeanIMTPlus, LeanIMTPlusProof, LeanIMTPlusHashFunctions } from "../../browser/LeanIMTPlus/src"
import { poseidon2, poseidon3 } from "poseidon-lite"

const wasmTester = require("circom_tester").wasm

const MAX_DEPTH = 10

const hashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: (a, b, c) => poseidon3([a, b, c]),
    internal: (a, b) => poseidon2([a, b])
}

function toInput(p: LeanIMTPlusProof<bigint>) {
    const depth = p.siblings.length
    const siblings = p.siblings.map((s) => s.toString())
    while (siblings.length < MAX_DEPTH) siblings.push("0")
    return {
        proofType: p.proofType.toString(),
        value: p.value.toString(),
        leafValue: p.leaf.value.toString(),
        leafNextValue: p.leaf.nextValue.toString(),
        leafIndex: p.leafIndex.toString(),
        depth: depth.toString(),
        siblings
    }
}

describe("LeanIMTPlus circuit", () => {
    let circuit: any
    let tree: LeanIMTPlus<bigint>

    before(async () => {
        circuit = await wasmTester("circuits/leanimt-plus/leanimt-plus.circom")
        tree = new LeanIMTPlus<bigint>(hashes)
        tree.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
    })

    it("verifies a membership proof and outputs the correct root", async () => {
        const proof = tree.generateProof(25n)
        assert.equal(proof.proofType, 0)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: tree.root.toString() })
    })

    it("verifies a non-membership proof for a value strictly between two leaves", async () => {
        const proof = tree.generateProof(20n)
        assert.equal(proof.proofType, 1)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: tree.root.toString() })
    })

    it("verifies a non-membership proof using the sentinel as low leaf", async () => {
        const proof = tree.generateProof(1n)
        assert.equal(proof.proofType, 1)
        assert.equal(proof.leaf.value, 0n)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: tree.root.toString() })
    })

    it("verifies a non-membership proof using the tail as low leaf", async () => {
        const proof = tree.generateProof(100n)
        assert.equal(proof.proofType, 1)
        assert.equal(proof.leaf.nextValue, 0n)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: tree.root.toString() })
    })

    it("verifies a membership proof after an update", async () => {
        const t = new LeanIMTPlus<bigint>(hashes)
        t.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
        t.update(25n, 22n)
        const proof = t.generateProof(22n)
        assert.equal(proof.proofType, 0)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: t.root.toString() })
    })

    it("verifies a non-membership proof for a value that was previously removed", async () => {
        const t = new LeanIMTPlus<bigint>(hashes)
        t.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
        t.remove(25n)
        const proof = t.generateProof(25n)
        assert.equal(proof.proofType, 1)
        const witness = await circuit.calculateWitness(toInput(proof))
        await circuit.assertOut(witness, { out: t.root.toString() })
    })

    it("rejects a membership proof whose leafValue does not equal value", async () => {
        const proof = tree.generateProof(25n)
        const tampered = { ...toInput(proof), value: "26" }
        try {
            await circuit.calculateWitness(tampered)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a non-membership proof claiming an actual member is absent", async () => {
        const proof = tree.generateProof(20n)
        const forged = { ...toInput(proof), value: "18" }
        try {
            await circuit.calculateWitness(forged)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a flipped proofType", async () => {
        const proof = tree.generateProof(10n)
        const flipped = { ...toInput(proof), proofType: "1" }
        try {
            await circuit.calculateWitness(flipped)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a non-boolean proofType", async () => {
        const proof = tree.generateProof(25n)
        const bad = { ...toInput(proof), proofType: "2" }
        try {
            await circuit.calculateWitness(bad)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects any proof targeting the zero value", async () => {
        const proof = tree.generateProof(25n)
        const zeroed = { ...toInput(proof), value: "0" }
        try {
            await circuit.calculateWitness(zeroed)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects an out-of-range value (>= 2^252)", async () => {
        const proof = tree.generateProof(25n)
        const oversize = (1n << 252n).toString()
        const bad = { ...toInput(proof), value: oversize }
        try {
            await circuit.calculateWitness(bad)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a non-canonical leafIndex (high bit set past depth)", async () => {
        const proof = tree.generateProof(25n)
        // Set a bit beyond `depth-1`, encoding the same physical position
        // non-canonically. The pastDepth guard must reject this.
        const nonCanonical = (proof.leafIndex | (1 << proof.siblings.length)).toString()
        const bad = { ...toInput(proof), leafIndex: nonCanonical }
        try {
            await circuit.calculateWitness(bad)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a non-membership proof whose low leaf is a tombstone (zero value at non-zero index)", async () => {
        const proof = tree.generateProof(20n)
        // Forge: keep the genuine leafIndex (non-zero) but set leafValue and
        // leafNextValue to 0, the tombstone shape. The tombstone-replay
        // guard must reject this.
        const forged = {
            ...toInput(proof),
            leafValue: "0",
            leafNextValue: "0"
        }
        try {
            await circuit.calculateWitness(forged)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })
})
