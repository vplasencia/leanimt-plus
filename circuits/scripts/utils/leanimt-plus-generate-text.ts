import { poseidon2, poseidon3 } from "poseidon-lite"
import {
  LeanIMTPlus,
  LeanIMTPlusHashFunctions
} from "../../../browser/LeanIMTPlus/src"

/**
 * Returns a small wrapper circuit for the given MAX_DEPTH. It reuses the
 * audited, template-only source at circuits/leanimt-plus/leanimt-plus.circom
 * (which declares `template LeanIMTPlus(MAX_DEPTH)` but no `component main`)
 * and just instantiates the main component at the requested depth.
 *
 * Generated circuits live at circuits/leanimt-plus-<n>/, the same nesting
 * level as the source, so the source's relative circomlib includes still
 * resolve correctly.
 */
export function createCircuitCode(maxDepth: number): string {
  return `pragma circom 2.2.3;

// Reuse the audited LeanIMT+ template; only the MAX_DEPTH instantiation
// differs per depth. See ../leanimt-plus/leanimt-plus.circom.
include "../leanimt-plus/leanimt-plus.circom";

component main {public [proofType]} = LeanIMTPlus(${maxDepth});
`
}

const hashes: LeanIMTPlusHashFunctions<bigint> = {
  leaf: (a, b, c) => poseidon3([a, b, c]),
  internal: (a, b) => poseidon2([a, b])
}

/**
 * Returns a valid `input.json` for a LeanIMT+ circuit of the given MAX_DEPTH.
 *
 * The tree is kept small enough that its real proof depth never exceeds
 * MAX_DEPTH (a tree with k physical leaves has depth ceil(log2(k))). We use a
 * membership proof of the first inserted value: it always exists, so proofType
 * is 0, and the `siblings` array is zero-padded up to MAX_DEPTH as the circuit
 * expects.
 */
export function createInput(maxDepth: number): string {
  const tree = new LeanIMTPlus<bigint>(hashes)

  // Cap user leaves at 6 (proof depth 3) for larger circuits, and shrink for
  // tiny depths so the proof depth stays <= MAX_DEPTH.
  const maxUserLeaves = Math.min(2 ** maxDepth - 1, 6)
  const values = Array.from({ length: Math.max(1, maxUserLeaves) }, (_, i) =>
    BigInt(i + 1)
  )
  tree.insertMany(values)

  const proof = tree.generateProof(values[0])

  const siblings = proof.siblings.map((s) => s.toString())
  while (siblings.length < maxDepth) {
    siblings.push("0")
  }

  const input = {
    proofType: proof.proofType,
    value: proof.value.toString(),
    leafValue: proof.leaf.value.toString(),
    leafNextValue: proof.leaf.nextValue.toString(),
    leafIndex: proof.leafIndex,
    depth: proof.siblings.length,
    siblings
  }

  return JSON.stringify(input, null, 2) + "\n"
}
