import { Bench } from "tinybench"
import { poseidon2 } from "poseidon-lite"
import { fillSMT, loadSMT } from "./utils/smt"
import { fillLeanIMTPlus } from "./utils/leanimt-plus"
import { LeanIMTPlus } from "../../../browser/LeanIMTPlus/src"
import { rowsFromBench, writeTable, SIZES, BenchRow } from "./utils/table"

const poseidonHash = (a: bigint, b: bigint) => poseidon2([a, b])

const ITERATIONS = 100

async function main() {
    const allRows: BenchRow[] = []
    const { verifyProof } = await loadSMT()

    for (const size of SIZES) {
        const bench = new Bench({ iterations: ITERATIONS })

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
                LeanIMTPlus.verifyProof(leanProof, poseidonHash)
            })

        await bench.run()
        allRows.push(...rowsFromBench(bench, smtName))
    }

    const out = writeTable("verify-membership.md", "Verify membership proof — LeanIMT+ vs SMT", allRows)
    console.log(out)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
