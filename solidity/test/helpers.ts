import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { LeanIMTPlusProof } from "./reference.js"

const BUILD_INFO_DIR = join(process.cwd(), "artifacts", "build-info")

/**
 * Hardhat 3 does not emit deployable artifacts for contracts that live inside an
 * npm dependency, so we pull the compiled Poseidon ABI + bytecode straight out of
 * the build-info the compiler already produced. This keeps `poseidon-solidity` as a
 * normal dependency instead of vendoring its (very large) source into the project.
 */
function readNpmContract(fqName: string): { abi: any[]; bytecode: string } {
  const outputs = readdirSync(BUILD_INFO_DIR).filter((f) =>
    f.endsWith(".output.json")
  )
  const [sourceName, contractName] = fqName.split(":")

  for (const file of outputs) {
    const info = JSON.parse(readFileSync(join(BUILD_INFO_DIR, file), "utf8"))
    const contract = info?.output?.contracts?.[sourceName]?.[contractName]
    if (contract) {
      return {
        abi: contract.abi,
        bytecode: `0x${contract.evm.bytecode.object}`
      }
    }
  }
  throw new Error(`Could not find ${fqName} in any build-info output`)
}

/** Deploys the Poseidon libraries, the LeanIMTPlus library, and a fresh test harness. */
export async function deployTree(ethers: any) {
  const [signer] = await ethers.getSigners()

  const t3Meta = readNpmContract(
    "npm/poseidon-solidity@0.0.5/PoseidonT3.sol:PoseidonT3"
  )
  const t4Meta = readNpmContract(
    "npm/poseidon-solidity@0.0.5/PoseidonT4.sol:PoseidonT4"
  )

  const t3 = await new ethers.ContractFactory(
    t3Meta.abi,
    t3Meta.bytecode,
    signer
  ).deploy()
  const t4 = await new ethers.ContractFactory(
    t4Meta.abi,
    t4Meta.bytecode,
    signer
  ).deploy()
  await t3.waitForDeployment()
  await t4.waitForDeployment()

  const lib = await ethers.deployContract("LeanIMTPlus", {
    libraries: {
      PoseidonT3: await t3.getAddress(),
      PoseidonT4: await t4.getAddress()
    }
  })

  const tree = await ethers.deployContract("LeanIMTPlusTest", {
    libraries: { LeanIMTPlus: await lib.getAddress() }
  })

  return tree
}

/**
 * Finds the physical index of the low leaf (predecessor) of `value` by scanning
 * the on-chain leaves — exactly what an off-chain client would do before calling
 * `insert` / `generateProof`. Returns the sentinel (index 0) when `value` is
 * smaller than every active value. Ignores tombstones.
 *
 * `excluded` (optional) is treated as already removed from the list, which is what
 * `update` needs: the new value's predecessor must be computed against the list
 * *after* the old value is unlinked.
 */
export async function findLowLeafIndex(
  tree: any,
  value: bigint,
  excluded: bigint | null = null
): Promise<bigint> {
  const count: bigint = await tree.leavesCount()
  let bestIndex = 0n // sentinel is always a candidate (value 0 < everything)
  let bestValue = -1n
  for (let i = 1n; i < count; i += 1n) {
    const leaf = await tree.getLeaf(i)
    const v: bigint = leaf.value
    if (v === 0n) continue // tombstone
    if (excluded !== null && v === excluded) continue // pretend it is unlinked
    if (v < value && v > bestValue) {
      bestValue = v
      bestIndex = i
    }
  }
  return bestIndex
}

/**
 * Normalizes a proof returned by the contract (an ethers `Result`, which is
 * read-only and does not re-encode as a tuple) into a plain, mutable object that
 * can be passed back into `verifyProof`. Optional `overrides` let tests tamper
 * with individual fields.
 */
export function toProofStruct(
  proof: any,
  overrides: Record<string, unknown> = {}
) {
  return {
    proofType: Number(proof.proofType),
    root: proof.root,
    value: proof.value,
    leafValue: proof.leafValue,
    leafNextValue: proof.leafNextValue,
    leafIndex: proof.leafIndex,
    siblings: [...proof.siblings],
    ...overrides
  }
}

/** Finds the predecessor of `value` (the leaf whose nextValue === value). */
export async function findPredecessorIndex(
  tree: any,
  value: bigint
): Promise<bigint> {
  const count: bigint = await tree.leavesCount()
  for (let i = 0n; i < count; i += 1n) {
    const leaf = await tree.getLeaf(i)
    if (leaf.nextValue === value) return i
  }
  throw new Error(`No predecessor found for ${value}`)
}

/**
 * Converts a proof produced by the reference `LeanIMTPlus` (browser implementation)
 * into the Solidity `LeanIMTPlusProof` struct shape, so a proof generated off-chain
 * can be verified on-chain.
 */
export function refProofToStruct(proof: LeanIMTPlusProof<bigint>) {
  return {
    proofType: proof.proofType,
    root: proof.root,
    value: proof.value,
    leafValue: proof.leaf.value,
    leafNextValue: proof.leaf.nextValue,
    leafIndex: BigInt(proof.leafIndex),
    siblings: [...proof.siblings]
  }
}

/**
 * Converts a proof returned by the contract into the reference implementation's
 * proof shape, so an on-chain proof can be checked by the off-chain verifier.
 */
export function contractProofToRef(proof: any): LeanIMTPlusProof<bigint> {
  return {
    proofType: Number(proof.proofType) as 0 | 1,
    root: proof.root,
    value: proof.value,
    leaf: { value: proof.leafValue, nextValue: proof.leafNextValue },
    leafIndex: Number(proof.leafIndex),
    siblings: [...proof.siblings]
  }
}
