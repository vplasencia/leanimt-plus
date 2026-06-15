// Regenerates the canonical input.json files for the Poseidon and SHA-256
// LeanIMT+ circuits from the current TS implementation. Run with:
//   npx tsx scripts/regenerate-inputs.ts
import { writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { poseidon2, poseidon3 } from "poseidon-lite"
import { LeanIMTPlus, LeanIMTPlusHashFunctions } from "../../browser/LeanIMTPlus/src"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const POSEIDON_MAX_DEPTH = 10
const SHA256_MAX_DEPTH = 4
const MASK_216 = (1n << 216n) - 1n

// ── Poseidon ────────────────────────────────────────────────────────────
const poseidonHashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: (a, b, c) => poseidon3([a, b, c]),
    internal: (a, b) => poseidon2([a, b])
}
const poseidonTree = new LeanIMTPlus<bigint>(poseidonHashes)
poseidonTree.insertMany([10n, 25n, 7n, 3n, 41n, 18n])

const pProof = poseidonTree.generateProof(25n)
const pSiblings = pProof.siblings.map((s) => s.toString())
while (pSiblings.length < POSEIDON_MAX_DEPTH) pSiblings.push("0")

const poseidonInput = {
    proofType: pProof.proofType,
    value: pProof.value.toString(),
    leafValue: pProof.leaf.value.toString(),
    leafNextValue: pProof.leaf.nextValue.toString(),
    leafIndex: pProof.leafIndex,
    depth: pProof.siblings.length,
    siblings: pSiblings
}
writeFileSync(
    join(ROOT, "circuits/leanimt-plus/input.json"),
    JSON.stringify(poseidonInput, null, 2) + "\n"
)
console.log("wrote circuits/leanimt-plus/input.json")

// ── SHA-256 ─────────────────────────────────────────────────────────────
function toBE27(x: bigint) {
    const buf = new Uint8Array(27)
    let v = x
    for (let i = 26; i >= 0; i--) {
        buf[i] = Number(v & 0xffn)
        v >>= 8n
    }
    return buf
}
function sha256Hash2(a: bigint, b: bigint): bigint {
    const buf = new Uint8Array(54)
    buf.set(toBE27(a), 0)
    buf.set(toBE27(b), 27)
    const digest = createHash("sha256").update(buf).digest()
    return BigInt("0x" + digest.toString("hex")) & MASK_216
}
const sha256Hashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: (a, b, c) => sha256Hash2(sha256Hash2(a, b), c),
    internal: sha256Hash2
}
const shaTree = new LeanIMTPlus<bigint>(sha256Hashes)
shaTree.insertMany([10n, 25n, 7n, 3n, 41n, 18n])

const sProof = shaTree.generateProof(25n)
const sSiblings = sProof.siblings.map((s) => s.toString())
while (sSiblings.length < SHA256_MAX_DEPTH) sSiblings.push("0")

const sha256Input = {
    proofType: sProof.proofType,
    value: sProof.value.toString(),
    leafValue: sProof.leaf.value.toString(),
    leafNextValue: sProof.leaf.nextValue.toString(),
    leafIndex: sProof.leafIndex,
    depth: sProof.siblings.length,
    siblings: sSiblings
}
writeFileSync(
    join(ROOT, "circuits/leanimt-plus-sha256/input-sha256.json"),
    JSON.stringify(sha256Input, null, 2) + "\n"
)
console.log("wrote circuits/leanimt-plus-sha256/input-sha256.json")
