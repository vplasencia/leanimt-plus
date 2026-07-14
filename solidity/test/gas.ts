import { network } from "hardhat"
import {
  deployTree,
  findLowLeafIndex,
  findPredecessorIndex,
  toProofStruct
} from "./helpers.js"

// Lightweight gas benchmark. Not an assertion suite — it inserts a batch of values
// and prints the gas used by a representative insert / update / remove / proof once
// the tree has some depth, so regressions are easy to spot.
describe("LeanIMTPlus gas", () => {
  it("reports gas for insert / update / remove / verify", async () => {
    const { ethers } = await network.getOrCreate()
    const tree = await deployTree(ethers)

    const N = 64
    let insertGas = 0n
    for (let k = 1; k <= N; k += 1) {
      const v = BigInt(k * 7 + 1) // spread-out, insertion order is not sorted order
      const low = await findLowLeafIndex(tree, v)
      const receipt = await (await tree.insert(v, low)).wait()
      if (k === N) insertGas = receipt!.gasUsed
    }

    const someValue = 8n // == 1*7+1, present
    const updGas = await (async () => {
      const oldPred = await findPredecessorIndex(tree, someValue)
      const newV = 9999n
      const newPred = await findLowLeafIndex(tree, newV, someValue)
      const r = await (
        await tree.update(someValue, newV, oldPred, newPred)
      ).wait()
      return r!.gasUsed
    })()

    const remValue = 15n // == 2*7+1
    const remGas = await (async () => {
      const pred = await findPredecessorIndex(tree, remValue)
      const r = await (await tree.remove(remValue, pred)).wait()
      return r!.gasUsed
    })()

    const memProof = toProofStruct(await tree.generateProof(22n, 0n))
    const memProofGas = await tree.verifyProof.estimateGas(memProof)
    const absent = 100000n
    const nonProof = toProofStruct(
      await tree.generateProof(absent, await findLowLeafIndex(tree, absent))
    )
    const nonProofGas = await tree.verifyProof.estimateGas(nonProof)

    const depth = await tree.depth()
    // eslint-disable-next-line no-console
    console.log(
      `\n    LeanIMTPlus gas (n=${N}, depth=${depth}):\n` +
        `      insert          : ${insertGas}\n` +
        `      update (in place): ${updGas}\n` +
        `      remove          : ${remGas}\n` +
        `      verify membership   : ${memProofGas}\n` +
        `      verify non-membership: ${nonProofGas}`
    )
  })
})
