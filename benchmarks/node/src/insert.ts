import { Bench } from "tinybench"
import { fillSMT } from "./utils/smt"
import { fillLeanIMTPlus } from "./utils/leanimt-plus"
import { rowsFromBench, writeTable, SIZES, BenchRow } from "./utils/table"

const ITERATIONS = 100
// Warmup runs let V8 JIT-compile the insert path before we start timing.
// Without this the first measured task in the process absorbs all the
// cold-start/JIT cost, which inflated the smallest tree the most.
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

        // Pre-fill once. Each iteration inserts the next-larger value, which
        // grows the tree slightly across the run; for the sizes we sweep this
        // drift is small relative to the baseline `size`, so the measured
        // average still reflects the cost of "insert into a tree of `size`".
        const smt = await fillSMT(size)
        const lean = fillLeanIMTPlus(size)
        let smtCounter = size
        let leanCounter = size

        const smtName = `SMT - Insert (tree size ${size})`
        const leanName = `LeanIMT+ - Insert (tree size ${size})`

        bench
            .add(smtName, async () => {
                smtCounter += 1
                await smt.add(BigInt(smtCounter), BigInt(smtCounter))
            })
            .add(leanName, () => {
                leanCounter += 1
                lean.insert(BigInt(leanCounter))
            })

        await bench.run()
        allRows.push(...rowsFromBench(bench, smtName))
    }

    const out = writeTable("insert.md", "Insert (single member): LeanIMT+ vs SMT", allRows)
    console.log(out)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
