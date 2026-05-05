import { Bench } from "tinybench"
import { fillSMT } from "./utils/smt"
import { fillLeanIMTPlus } from "./utils/leanimt-plus"
import { rowsFromBench, writeTable, SIZES, BenchRow } from "./utils/table"

const ITERATIONS = 30

async function main() {
    const allRows: BenchRow[] = []

    for (const size of SIZES) {
        const bench = new Bench({ iterations: ITERATIONS })

        const smt = await fillSMT(size)
        const lean = fillLeanIMTPlus(size)
        // A value certain to be absent from a tree filled with [1..size].
        const target = BigInt(size + 999)
        const smtRoot = await smt.root()

        const smtName = `SMT - Generate non-membership proof (tree size ${size})`
        const leanName = `LeanIMT+ - Generate non-membership proof (tree size ${size})`

        bench
            .add(smtName, async () => {
                await smt.generateProof(target, smtRoot)
            })
            .add(leanName, () => {
                lean.generateProof(target)
            })

        await bench.run()
        allRows.push(...rowsFromBench(bench, smtName))
    }

    const out = writeTable(
        "generate-non-membership.md",
        "Generate non-membership proof — LeanIMT+ vs SMT",
        allRows
    )
    console.log(out)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
