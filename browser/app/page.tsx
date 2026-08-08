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
  "Generate Inclusion Merkle Proof",
  "Generate Non-Inclusion Merkle Proof",
  "Verify Inclusion Merkle Proof",
  "Verify Non-Inclusion Merkle Proof",
  "Generate Membership ZK Proof",
  "Generate Non-Membership ZK Proof",
  "Recreate + Generate MP + ZKP",
  "Insert member",
  "Update Member"
]

// A benchmark cell is either a measured time in milliseconds or the string
// "N/A", used for the rows that do not apply to a tree, e.g. non-inclusion
// proofs on the plain LeanIMT.
type TimeValue = number | "N/A"

// Rows that do not apply to the plain LeanIMT: it is not an indexed tree, so
// non-inclusion is outside what it is meant to do, not a missing feature.
// They are shown as "N/A" from the start, before any benchmark runs, instead
// of only once the run reaches them.
const leanIMTNotApplicableRows = new Set([
  functions.indexOf("Generate Non-Inclusion Merkle Proof"),
  functions.indexOf("Verify Non-Inclusion Merkle Proof"),
  functions.indexOf("Generate Non-Membership ZK Proof")
])

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

  // ---------------------------------------------------------------------
  // SMT
  // ---------------------------------------------------------------------
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

    // A key that was never inserted: the inserted keys are 1..smtLeaves - 1
    // plus commitment0.
    const smtNonMember = BigInt(smtLeaves + 100)

    // Generate Inclusion Merkle Proof (commitment0 is in the tree).
    const [proof, time1] = await run(
      async () => await smt.generateProof(commitment0)
    )

    timeValues.push(time1)

    setSMTTimes(timeValues.slice())

    // Generate Non-Inclusion Merkle Proof (smtNonMember is not in the tree).
    const [nonInclusionProof, time2] = await run(
      async () => await smt.generateProof(smtNonMember)
    )

    timeValues.push(time2)

    setSMTTimes(timeValues.slice())

    // Verify Inclusion Merkle Proof.
    const [, time3] = await run(
      async () =>
        await verifyProof(
          await smt.root(),
          proof.proof as Proof,
          commitment0,
          commitment0
        )
    )

    timeValues.push(time3)

    setSMTTimes(timeValues.slice())

    // Verify Non-Inclusion Merkle Proof.
    const [, timeVerifyNonInclusion] = await run(
      async () =>
        await verifyProof(
          await smt.root(),
          nonInclusionProof.proof as Proof,
          smtNonMember,
          smtNonMember
        )
    )

    timeValues.push(timeVerifyNonInclusion)

    setSMTTimes(timeValues.slice())

    // Generate Membership ZK Proof (fnc = 0) for commitment0.
    const smtMembershipCircomProof = await smt.generateCircomVerifierProof(
      commitment0,
      await smt.root()
    )

    const [, time4] = await run(
      async () =>
        await groth16.fullProve(
          {
            enabled: 1,
            fnc: 0, // 0 for membership proofs, 1 for non-membership proofs
            root: smtMembershipCircomProof.root.string(),
            siblings: smtMembershipCircomProof.siblings.map((s) => s.string()),
            oldKey: smtMembershipCircomProof.oldKey.string(),
            oldValue: smtMembershipCircomProof.oldValue.string(),
            isOld0: smtMembershipCircomProof.isOld0 ? 1 : 0,
            key: smtMembershipCircomProof.key.string(),
            value: smtMembershipCircomProof.value.string()
          },
          getWasmPath("smt", smtMaxLevels),
          getZkeyPath("smt", smtMaxLevels)
        )
    )

    timeValues.push(time4)

    setSMTTimes(timeValues.slice())

    // Generate Non-Membership ZK Proof (fnc = 1) for smtNonMember.
    const smtNonMembershipCircomProof = await smt.generateCircomVerifierProof(
      smtNonMember,
      await smt.root()
    )

    const [, time5] = await run(
      async () =>
        await groth16.fullProve(
          {
            enabled: 1,
            fnc: 1, // 0 for membership proofs, 1 for non-membership proofs
            root: smtNonMembershipCircomProof.root.string(),
            siblings: smtNonMembershipCircomProof.siblings.map((s) =>
              s.string()
            ),
            oldKey: smtNonMembershipCircomProof.oldKey.string(),
            oldValue: smtNonMembershipCircomProof.oldValue.string(),
            isOld0: smtNonMembershipCircomProof.isOld0 ? 1 : 0,
            key: smtNonMembershipCircomProof.key.string(),
            value: smtNonMembershipCircomProof.value.string()
          },
          getWasmPath("smt", smtMaxLevels),
          getZkeyPath("smt", smtMaxLevels)
        )
    )

    timeValues.push(time5)

    setSMTTimes(timeValues.slice())

    // Recreate + Generate MP + ZKP (inclusion MP + membership ZKP).
    timeValues.push(time0 + time1 + time4)

    setSMTTimes(timeValues.slice())

    const { commitment: commitment1 } = new Identity()

    const [, time6] = await run(
      async () => await smt.add(commitment1, commitment1)
    )

    timeValues.push(time6)

    setSMTTimes(timeValues.slice())

    const { commitment: commitment2 } = new Identity()

    const [, time7] = await run(
      async () => await smt.update(commitment0, commitment2)
    )

    timeValues.push(time7)

    setSMTTimes(timeValues.slice())
  }, [smtMaxLevels, smtLeaves])

  // ---------------------------------------------------------------------
  // LeanIMT
  // ---------------------------------------------------------------------
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

    // Generate Inclusion Merkle Proof.
    const [proof, time1] = await run(() =>
      leanIMT.generateProof(leanIMTLeaves - 1)
    )

    timeValues.push(time1)

    setLeanIMTTimes(timeValues.slice())

    // Generate Non-Inclusion Merkle Proof: the plain LeanIMT is not an
    // indexed tree, so it cannot prove non-inclusion.
    timeValues.push("N/A")

    setLeanIMTTimes(timeValues.slice())

    // Verify Inclusion Merkle Proof.
    const [, time2] = await run(() =>
      leanIMT.verifyProof(proof as LeanIMTMerkleProof)
    )

    timeValues.push(time2)

    setLeanIMTTimes(timeValues.slice())

    // Verify Non-Inclusion Merkle Proof: there is no non-inclusion proof to
    // verify on the plain LeanIMT.
    timeValues.push("N/A")

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

    // Generate Non-Membership ZK Proof: the LeanIMT circuit only proves
    // membership, so this does not apply.
    timeValues.push("N/A")

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

  // ---------------------------------------------------------------------
  // LeanIMT+
  // ---------------------------------------------------------------------
  const runLeanIMTPlusFunctions = useCallback(async () => {
    const timeValues: TimeValue[] = []

    const { commitment: commitment0 } = new Identity()

    const leanIMTPlusHashes: LeanIMTPlusHashFunctions<bigint> = {
      leaf: (a, b, c) => poseidon3([a, b, c]),
      internal: (a, b) => poseidon2([a, b])
    }

    const leanIMTPlus = new LeanIMTPlus<bigint>(leanIMTPlusHashes)

    // Even values only, so every odd value is a guaranteed non-member whose
    // low leaf and successor are both small (see the ZK note below).
    const members = Array.from({ length: leanIMTPlusLeaves - 1 }, (_, i) =>
      BigInt((i + 1) * 2)
    )

    members.push(commitment0)

    // Recreate Tree
    const [, time0] = await run(() => leanIMTPlus.insertMany(members))

    timeValues.push(time0)

    setLeanIMTPlusTimes(timeValues.slice())

    // Generate Inclusion Merkle Proof (membership of commitment0).
    const [proof, time1] = await run(() =>
      leanIMTPlus.generateProof(commitment0)
    )

    timeValues.push(time1)

    setLeanIMTPlusTimes(timeValues.slice())

    // Generate Non-Inclusion Merkle Proof. Only even values were inserted,
    // so 1 is not a member and `generateProof` returns a proof with
    // `proofType: 1` (the low leaf of 1).
    const [nonInclusionProof, timeNonInclusion] = await run(() =>
      leanIMTPlus.generateProof(1n)
    )

    timeValues.push(timeNonInclusion)

    setLeanIMTPlusTimes(timeValues.slice())

    // Verify Inclusion Merkle Proof.
    const [, time2] = await run(() =>
      leanIMTPlus.verifyProof(proof as LeanIMTPlusProof<bigint>)
    )

    timeValues.push(time2)

    setLeanIMTPlusTimes(timeValues.slice())

    // Verify Non-Inclusion Merkle Proof (the `proofType: 1` proof of 1).
    const [, timeVerifyNonInclusion] = await run(() =>
      leanIMTPlus.verifyProof(nonInclusionProof as LeanIMTPlusProof<bigint>)
    )

    timeValues.push(timeVerifyNonInclusion)

    setLeanIMTPlusTimes(timeValues.slice())

    // ZK proofs.
    //
    // The LeanIMT+ circuit range-checks value, leafValue and leafNextValue to
    // 252 bits (Num2Bits(252)), but Semaphore commitments are ~253-bit field
    // elements and would trip that check. So both ZK benchmarks target small,
    // in-range values whose low leaf and successor are also small. Proof
    // generation time is driven by the circuit depth, not by the specific
    // value, so this stays a representative benchmark.
    //
    // `zkMemberTarget` is an even value (a member), and `zkMemberTarget + 1`
    // is odd and therefore never inserted, so it is a guaranteed non-member
    // sitting between two small even leaves.
    const zkMemberTarget = BigInt(
      2 * Math.max(1, Math.floor(leanIMTPlusLeaves / 2))
    )
    const zkNonMemberTarget = zkMemberTarget + 1n

    const padSiblings = (siblings: bigint[], depth: number): bigint[] => {
      const padded = siblings.slice()
      for (let i = 0; i < depth; i += 1) {
        if (padded[i] === undefined) {
          padded[i] = 0n
        }
      }
      return padded
    }

    // Generate Membership ZK Proof (proofType 0).
    const zkProof = leanIMTPlus.generateProof(zkMemberTarget)

    const leanIMTPlusDepth =
      zkProof.siblings.length !== 0 ? zkProof.siblings.length : 1
    const zkSiblings = padSiblings(zkProof.siblings, leanIMTPlusDepth)

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

    // Generate Non-Membership ZK Proof (proofType 1).
    const zkNonMembershipProof = leanIMTPlus.generateProof(zkNonMemberTarget)

    const leanIMTPlusNonMembershipDepth =
      zkNonMembershipProof.siblings.length !== 0
        ? zkNonMembershipProof.siblings.length
        : 1
    const zkNonMembershipSiblings = padSiblings(
      zkNonMembershipProof.siblings,
      leanIMTPlusNonMembershipDepth
    )

    const [, timeNonMembershipZk] = await run(
      async () =>
        await groth16.fullProve(
          {
            proofType: zkNonMembershipProof.proofType,
            value: zkNonMembershipProof.value,
            leafValue: zkNonMembershipProof.leaf.value,
            leafNextValue: zkNonMembershipProof.leaf.nextValue,
            leafIndex: zkNonMembershipProof.leafIndex,
            depth: zkNonMembershipProof.siblings.length,
            siblings: zkNonMembershipSiblings
          },
          getWasmPath("leanimt-plus", leanIMTPlusNonMembershipDepth),
          getZkeyPath("leanimt-plus", leanIMTPlusNonMembershipDepth)
        )
    )

    timeValues.push(timeNonMembershipZk)

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
                      {fn}
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
                      {fn}
                    </div>
                    <div className="font-normal">
                      {formatTime(
                        leanIMTNotApplicableRows.has(i)
                          ? "N/A"
                          : leanIMTTimes[i]
                      )}
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
                      {fn}
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
      {/* Notes */}
      <div className="flex flex-col gap-2 mt-20 max-w-3xl text-base">
        <div className="text-xl font-bold">Notes</div>
        <p>
          <span className="font-semibold">N/A</span> means the tree is not meant
          to do that operation.{" "}
          <a
            href="https://zkkit.org/leanimt-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            LeanIMT
          </a>{" "}
          can only prove that a value <span className="font-semibold">is</span>{" "}
          in the tree.{" "}
          <a
            href="https://docs.iden3.io/publications/pdfs/Merkle-Tree.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            SMT
          </a>{" "}
          and{" "}
          <a
            href="https://pse.dev/blog/lean-imt-plus-efficient-merkle-tree-for-membership-and-non-membership-proofs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            LeanIMT+
          </a>{" "}
          can also prove that a value{" "}
          <span className="font-semibold">is not</span> in the tree.
        </p>
      </div>
    </div>
  )
}
