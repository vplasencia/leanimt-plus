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
        const target = BigInt(Math.max(1, Math.floor(size / 2)))
        const smtRoot = await smt.root()

        const smtName = `SMT - Generate membership proof (tree size ${size})`
        const leanName = `LeanIMT+ - Generate membership proof (tree size ${size})`

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

    const out = writeTable("generate-membership.md", "Generate membership proof — LeanIMT+ vs SMT", allRows)
    console.log(out)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
