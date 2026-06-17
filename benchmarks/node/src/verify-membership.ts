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
    const target = BigInt(Math.max(1, Math.floor(size / 2)))
    const smtRoot = await smt.root()
    const smtProof = (await smt.generateProof(target, smtRoot)).proof
    const leanProof = lean.generateProof(target)

    const smtName = `SMT - Verify membership proof (tree size ${size})`
    const leanName = `LeanIMT+ - Verify membership proof (tree size ${size})`

    bench
      .add(smtName, async () => {
        await verifyProof(smtRoot, smtProof, target, target)
      })
      .add(leanName, () => {
        LeanIMTPlus.verifyProof(leanProof, hashes)
      })

    await bench.run()
    allRows.push(...rowsFromBench(bench, smtName))
  }

  const out = writeTable(
    "verify-membership.md",
    "Verify membership proof: LeanIMT+ vs SMT",
    allRows
  )
  console.log(out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
