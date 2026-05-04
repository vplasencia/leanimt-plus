require("ts-node/register")
const { LeanIMTPlus } = require("../../browser/LeanIMTPlus/src")
const { poseidon2 } = require("poseidon-lite")
const fs = require("fs")
const path = require("path")
const h = (a, b) => poseidon2([a, b])
const t = new LeanIMTPlus(h)
t.insertMany([10n, 25n, 7n, 3n, 41n, 18n])
const p = t.generateProof(25n)
const MAX_DEPTH = 10
const siblings = p.siblings.map((s) => s.toString())
while (siblings.length < MAX_DEPTH) siblings.push("0")
const out = {
    proofType: p.proofType,
    value: p.value.toString(),
    leafValue: p.leaf.value.toString(),
    leafNextValue: p.leaf.nextValue.toString(),
    leafIndex: p.leafIndex,
    depth: p.siblings.length,
    siblings
}
fs.writeFileSync(path.join(__dirname, "circuits/leanimt-plus/input.json"), JSON.stringify(out, null, 2) + "\n")
console.log("written")
