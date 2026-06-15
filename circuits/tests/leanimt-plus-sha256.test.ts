import { assert } from "chai"
import { describe } from "mocha"
import { createHash } from "crypto"
import { LeanIMTPlus, LeanIMTPlusProof, LeanIMTPlusHashFunctions } from "../../browser/LeanIMTPlus/src"

const wasmTester = require("circom_tester").wasm

const MAX_DEPTH = 10
const MASK_216 = (1n << 216n) - 1n

function toBE27(x: bigint): Uint8Array {
    const buf = new Uint8Array(27)
    let v = x
    for (let i = 26; i >= 0; i--) {
        buf[i] = Number(v & 0xffn)
        v >>= 8n
    }
    return buf
}

// Hash two field elements with SHA-256, encoded as 27-byte big-endian
// integers (216 bits each). The 256-bit digest is truncated to its lower
// 216 bits so it round-trips through the circuit's `Sha256_2` template.
function sha256Hash2(a: bigint, b: bigint): bigint {
    const buf = new Uint8Array(54)
    buf.set(toBE27(a), 0)
    buf.set(toBE27(b), 27)
    const digest = createHash("sha256").update(buf).digest()
    const big = BigInt("0x" + digest.toString("hex"))
    return big & MASK_216
}

// Leaf commitment mirrors the circuit:
//   Sha256_2(Sha256_2(value, nextValue), TAG_LEAF=1)
// The extra wrapping pass with the constant tag `1` provides domain
// separation between leaves and internal nodes.
function sha256LeafHash(value: bigint, nextValue: bigint, tag: bigint): bigint {
    return sha256Hash2(sha256Hash2(value, nextValue), tag)
}

const hashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: sha256LeafHash,
    internal: sha256Hash2
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

describe("LeanIMTPlus circuit (SHA-256)", function () {
    this.timeout(120000)

    let circuit: any
    let tree: LeanIMTPlus<bigint>

    before(async () => {
        circuit = await wasmTester("circuits/leanimt-plus-sha256/leanimt-plus-sha256.circom")
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

    it("rejects an out-of-range value (>= 2^216)", async () => {
        const proof = tree.generateProof(25n)
        const oversize = (1n << 216n).toString()
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
        const nonCanonical = (proof.leafIndex | (1 << proof.siblings.length)).toString()
        const bad = { ...toInput(proof), leafIndex: nonCanonical }
        try {
            await circuit.calculateWitness(bad)
            assert.fail("expected witness generation to fail")
        } catch (err: any) {
            assert.include(err.message, "Assert Failed")
        }
    })

    it("rejects a non-membership proof whose low leaf is a tombstone", async () => {
        const proof = tree.generateProof(20n)
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
