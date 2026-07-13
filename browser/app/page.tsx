"use client"

import { useCallback, useState } from "react"
import { LeanIMT, LeanIMTMerkleProof } from "@zk-kit/lean-imt"
import { poseidon2, poseidon3 } from "poseidon-lite"
import { groth16 } from "snarkjs"
import {
  Merkletree,
  str2Bytes,
  InMemoryDB,
  verifyProof,
  Proof
} from "@iden3/js-merkletree"
import { Identity } from "@semaphore-protocol/identity"
import prettyMilliseconds from "pretty-ms"
import {
  LeanIMTPlus,
  LeanIMTPlusHashFunctions,
  LeanIMTPlusProof
} from "@/LeanIMTPlus/src"
import { run } from "@/utils/run-function"
import InputNumber from "@/components/InputNumber"

const functions = [
  "Recreate Tree",
  "Generate Merkle Proof",
  "Verify Merkle Proof",
  "Generate ZK Proof",
  "Recreate + Generate MP + ZKP",
  "Insert member",
  "Update Member"
]

// A benchmark cell is either a measured time in milliseconds or the string
// "N/A" (used for LeanIMT+ ZK rows, which have no proving key yet).
type TimeValue = number | "N/A"

const getWasmPath = (tree: string, depth: number): string => {
  return `/zk-artifacts/${tree}-${depth}.wasm`
}

const getZkeyPath = (tree: string, depth: number): string => {
  return `/zk-artifacts/${tree}-${depth}.zkey`
}

const formatTime = (value: TimeValue | undefined): string => {
  if (value === "N/A") {
    return "N/A"
  }
  return value
    ? prettyMilliseconds(value, { millisecondsDecimalDigits: 1 })
    : "0ms"
}

export default function Home() {
  const [smtMaxLevels, setSMTMaxLevels] = useState<number>(20)
  const [smtLeaves, setSMTLeaves] = useState<number>(100)
  const [leanIMTLeaves, setLeanIMTLeaves] = useState<number>(100)
  const [leanIMTPlusLeaves, setLeanIMTPlusLeaves] = useState<number>(100)
  const [smtTimes, setSMTTimes] = useState<TimeValue[]>([])
  const [leanIMTTimes, setLeanIMTTimes] = useState<TimeValue[]>([])
  const [leanIMTPlusTimes, setLeanIMTPlusTimes] = useState<TimeValue[]>([])

  const runSMTFunctions = useCallback(async () => {
    const timeValues: TimeValue[] = []

    const { commitment: commitment0 } = new Identity()

    const smt = new Merkletree(
      new InMemoryDB(str2Bytes("Tree")),
      true,
      smtMaxLevels
    )

    const members = Array.from({ length: smtLeaves - 1 }, (_, i) => ({
      key: BigInt(i + 1),
      value: BigInt(i + 1)
    }))

    members.push({ key: commitment0, value: commitment0 })

    const [, time0] = await run(async () => {
      for (let i = 0; i < members.length; i++) {
        await smt.add(members[i].key, members[i].value)
      }
    })
    timeValues.push(time0)
    setSMTTimes(timeValues.slice())

    const [proof, time1] = await run(
      async () => await smt.generateProof(commitment0)
    )

    timeValues.push(time1)

    setSMTTimes(timeValues.slice())

    const [, time2] = await run(
      async () =>
        await verifyProof(
          await smt.root(),
          proof.proof as Proof,
          commitment0,
          commitment0
        )
    )

    timeValues.push(time2)

    setSMTTimes(timeValues.slice())

    const smtCircomProof = await smt.generateCircomVerifierProof(
      BigInt(smtLeaves + 100),
      await smt.root()
    )

    const [, time3] = await run(
      async () =>
        await groth16.fullProve(
          {
            enabled: 1,
            fnc: 1, // 0 for membership proofs, 1 for non-membership proofs
            root: smtCircomProof.root.string(),
            siblings: smtCircomProof.siblings.map((s) => s.string()),
            oldKey: smtCircomProof.oldKey.string(),
            oldValue: smtCircomProof.oldValue.string(),
            isOld0: smtCircomProof.isOld0 ? 1 : 0,
            key: smtCircomProof.key.string(),
            value: smtCircomProof.value.string()
          },
          getWasmPath("smt", smtMaxLevels),
          getZkeyPath("smt", smtMaxLevels)
        )
    )

    timeValues.push(time3)

    setSMTTimes(timeValues.slice())

    timeValues.push(time0 + time1 + time3)

    setSMTTimes(timeValues.slice())

    const { commitment: commitment1 } = new Identity()

    const [, time4] = await run(
      async () => await smt.add(commitment1, commitment1)
    )

    timeValues.push(time4)

    setSMTTimes(timeValues.slice())

    const { commitment: commitment2 } = new Identity()

    const [, time5] = await run(
      async () => await smt.update(commitment0, commitment2)
    )

    timeValues.push(time5)

    setSMTTimes(timeValues.slice())
  }, [smtMaxLevels, smtLeaves])

  const runLeanIMTFunctions = useCallback(async () => {
    const timeValues: TimeValue[] = []

    const { commitment: commitment0 } = new Identity()

    const leanIMTHash = (a: bigint, b: bigint) => poseidon2([a, b])
    const leanIMT = new LeanIMT(leanIMTHash)

    const members = Array.from({ length: leanIMTLeaves - 1 }, (_, i) =>
      BigInt(i + 1)
    )

    members.push(commitment0)

    const [, time0] = await run(async () => await leanIMT.insertMany(members))

    timeValues.push(time0)

    setLeanIMTTimes(timeValues.slice())

    const [proof, time1] = await run(() =>
      leanIMT.generateProof(leanIMTLeaves - 1)
    )

    timeValues.push(time1)

    setLeanIMTTimes(timeValues.slice())

    const [, time2] = await run(() =>
      leanIMT.verifyProof(proof as LeanIMTMerkleProof)
    )

    timeValues.push(time2)

    setLeanIMTTimes(timeValues.slice())

    const leanIMTDepth = proof.siblings.length !== 0 ? proof.siblings.length : 1
    for (let i = 0; i < leanIMTDepth; i += 1) {
      if (proof.siblings[i] === undefined) {
        proof.siblings[i] = 0n
      }
    }

    const [, time3] = await run(
      async () =>
        await groth16.fullProve(
          {
            leaf: 2n,
            depth: leanIMTDepth,
            index: proof.index,
            siblings: proof.siblings
          },
          getWasmPath("leanimt", leanIMTDepth),
          getZkeyPath("leanimt", leanIMTDepth)
        )
    )

    timeValues.push(time3)

    setLeanIMTTimes(timeValues.slice())

    timeValues.push(time0 + time1 + time3)

    setLeanIMTTimes(timeValues.slice())

    const { commitment: commitment1 } = new Identity()

    const [, time4] = await run(() => leanIMT.insert(commitment1))

    timeValues.push(time4)

    setLeanIMTTimes(timeValues.slice())

    const { commitment: commitment2 } = new Identity()

    const [, time5] = await run(
      async () => await leanIMT.update(leanIMTLeaves - 1, commitment2)
    )

    timeValues.push(time5)

    setLeanIMTTimes(timeValues.slice())
  }, [leanIMTLeaves])

  const runLeanIMTPlusFunctions = useCallback(async () => {
    const timeValues: TimeValue[] = []

    const { commitment: commitment0 } = new Identity()

    const leanIMTPlusHashes: LeanIMTPlusHashFunctions<bigint> = {
      leaf: (a, b, c) => poseidon3([a, b, c]),
      internal: (a, b) => poseidon2([a, b])
    }

    const leanIMTPlus = new LeanIMTPlus<bigint>(leanIMTPlusHashes)

    const members = Array.from({ length: leanIMTPlusLeaves - 1 }, (_, i) =>
      BigInt(i + 1)
    )

    members.push(commitment0)

    // Recreate Tree
    const [, time0] = await run(() => leanIMTPlus.insertMany(members))

    timeValues.push(time0)

    setLeanIMTPlusTimes(timeValues.slice())

    // Generate Merkle Proof (membership of commitment0)
    const [proof, time1] = await run(() =>
      leanIMTPlus.generateProof(commitment0)
    )

    timeValues.push(time1)

    setLeanIMTPlusTimes(timeValues.slice())

    // Verify Merkle Proof
    const [, time2] = await run(() =>
      leanIMTPlus.verifyProof(proof as LeanIMTPlusProof<bigint>)
    )

    timeValues.push(time2)

    setLeanIMTPlusTimes(timeValues.slice())

    // Generate ZK Proof (membership).
    //
    // The LeanIMT+ circuit range-checks value, leafValue and leafNextValue to
    // 252 bits (Num2Bits(252)), but Semaphore commitments are ~253-bit field
    // elements and would trip that check. So we prove membership of a small,
    // in-range value from the tree. Its successor is also small (in range),
    // which keeps leafNextValue within bounds too. Proof-generation time is
    // driven by the circuit depth, not the specific value, so this stays a
    // representative benchmark.
    const zkTarget = BigInt(Math.max(1, Math.floor(leanIMTPlusLeaves / 2)))
    const zkProof = leanIMTPlus.generateProof(zkTarget)

    const leanIMTPlusDepth =
      zkProof.siblings.length !== 0 ? zkProof.siblings.length : 1
    const zkSiblings = zkProof.siblings.slice()
    for (let i = 0; i < leanIMTPlusDepth; i += 1) {
      if (zkSiblings[i] === undefined) {
        zkSiblings[i] = 0n
      }
    }

    const [, time3] = await run(
      async () =>
        await groth16.fullProve(
          {
            proofType: zkProof.proofType,
            value: zkProof.value,
            leafValue: zkProof.leaf.value,
            leafNextValue: zkProof.leaf.nextValue,
            leafIndex: zkProof.leafIndex,
            depth: zkProof.siblings.length,
            siblings: zkSiblings
          },
          getWasmPath("leanimt-plus", leanIMTPlusDepth),
          getZkeyPath("leanimt-plus", leanIMTPlusDepth)
        )
    )

    timeValues.push(time3)

    setLeanIMTPlusTimes(timeValues.slice())

    // Recreate + Generate MP + ZKP
    timeValues.push(time0 + time1 + time3)

    setLeanIMTPlusTimes(timeValues.slice())

    // Insert member
    const { commitment: commitment1 } = new Identity()

    const [, time4] = await run(() => leanIMTPlus.insert(commitment1))

    timeValues.push(time4)

    setLeanIMTPlusTimes(timeValues.slice())

    // Update Member
    const { commitment: commitment2 } = new Identity()

    const [, time5] = await run(() =>
      leanIMTPlus.update(commitment0, commitment2)
    )

    timeValues.push(time5)

    setLeanIMTPlusTimes(timeValues.slice())
  }, [leanIMTPlusLeaves])

  return (
    <div className="flex flex-col my-10 mx-10">
      <div className="flex flex-wrap gap-y-20 justify-around w-full">
        {/* SMT */}
        <div className="flex flex-col gap-6 justify-end items-start">
          <div className="text-2xl font-bold">SMT</div>
          <div className="flex flex-col gap-4">
            <InputNumber
              title="Max Levels"
              defaultValue={20}
              onChange={setSMTMaxLevels}
            />
            <InputNumber
              title="Tree Leaves"
              defaultValue={100}
              onChange={setSMTLeaves}
            />
            <button
              onClick={runSMTFunctions}
              className="flex justify-center items-center cursor-pointer disabled:cursor-not-allowed space-x-3 font-medium rounded-md px-3 py-2 w-full bg-blue-200 hover:bg-blue-300 transition-colors duration-300 ease-in-out"
            >
              Run Functions
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              {functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="flex gap-6 py-2">
                    <div className="flex font-semibold sm:w-96 md:w-72 w-40">
                      {fn.includes("Generate ZK Proof")
                        ? "Generate Non-Membership ZK Proof"
                        : fn}
                    </div>
                    <div className="font-normal">{formatTime(smtTimes[i])}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* LeanIMT */}
        <div className="flex flex-col gap-6 justify-end items-start">
          <div className="text-2xl font-bold mb-14">LeanIMT</div>
          <div className="flex flex-col gap-4">
            <InputNumber
              title="Tree Leaves"
              defaultValue={100}
              onChange={setLeanIMTLeaves}
            />
            <button
              onClick={runLeanIMTFunctions}
              className="flex justify-center items-center cursor-pointer disabled:cursor-not-allowed space-x-3 font-medium rounded-md px-3 py-2 w-full bg-blue-200 hover:bg-blue-300 transition-colors duration-300 ease-in-out"
            >
              Run Functions
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              {functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="flex gap-6 py-2">
                    <div className="flex font-semibold sm:w-96 md:w-72 w-40">
                      {fn.includes("Generate ZK Proof")
                        ? "Generate Membership ZK Proof"
                        : fn}
                    </div>
                    <div className="font-normal">
                      {formatTime(leanIMTTimes[i])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* LeanIMT+ */}
        <div className="flex flex-col gap-6 justify-end items-start">
          <div className="text-2xl font-bold mb-14">LeanIMT+</div>
          <div className="flex flex-col gap-4">
            <InputNumber
              title="Tree Leaves"
              defaultValue={100}
              onChange={setLeanIMTPlusLeaves}
            />
            <button
              onClick={runLeanIMTPlusFunctions}
              className="flex justify-center items-center cursor-pointer disabled:cursor-not-allowed space-x-3 font-medium rounded-md px-3 py-2 w-full bg-blue-200 hover:bg-blue-300 transition-colors duration-300 ease-in-out"
            >
              Run Functions
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              {functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="flex gap-6 py-2">
                    <div className="flex font-semibold sm:w-96 md:w-72 w-40">
                      {fn.includes("Generate ZK Proof")
                        ? "Generate Membership ZK Proof"
                        : fn}
                    </div>
                    <div className="font-normal">
                      {formatTime(leanIMTPlusTimes[i])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
