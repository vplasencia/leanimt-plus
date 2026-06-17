import { Bench } from "tinybench"
import { fillSMT, verifyProof } from "./utils/smt"
import { fillLeanIMTPlus, hashes } from "./utils/leanimt-plus"
import { LeanIMTPlus } from "../../../browser/LeanIMTPlus/src"
import { rowsFromBench, writeTable, SIZES, BenchRow } from "./utils/table"

const ITERATIONS = 100
// Warmup runs let V8 JIT-compile the verify path before we start timing, so the
// first measured task in the process doesn't absorb all the cold-start cost.
const WARMUP_ITERATIONS = 20

async function main() {
  const allRows: BenchRow[] = []

  for (const size of SIZES) {
    const bench = new Bench({
      time: 0,
      iterations: ITERATIONS,
      warmupTime: 0,
      warmupIterations: WARMUP_ITERATIONS
    })

    const smt = await fillSMT(size)
    const lean = fillLeanIMTPlus(size)
    const target = BigInt(size + 999)
    const smtRoot = await smt.root()
    const smtProof = (await smt.generateProof(target, smtRoot)).proof
    const leanProof = lean.generateProof(target)

    const smtName = `SMT - Verify non-membership proof (tree size ${size})`
    const leanName = `LeanIMT+ - Verify non-membership proof (tree size ${size})`

    bench
      .add(smtName, async () => {
        // For SMT non-membership, value=0 (the proof carries nodeAux internally).
        await verifyProof(smtRoot, smtProof, target, 0n)
      })
      .add(leanName, () => {
        LeanIMTPlus.verifyProof(leanProof, hashes)
      })

    await bench.run()
    allRows.push(...rowsFromBench(bench, smtName))
  }

  const out = writeTable(
    "verify-non-membership.md",
    "Verify non-membership proof: LeanIMT+ vs SMT",
    allRows
  )
  console.log(out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
