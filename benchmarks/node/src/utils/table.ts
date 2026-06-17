import { getMarkdownTable } from "markdown-table-ts"
import { writeFileSync, mkdirSync } from "fs"
import { dirname, resolve } from "path"
import { Bench } from "tinybench"

export type BenchRow = {
    name: string
    opsPerSec: number
    averageTimeMs: number
    samples: number
    relative?: string
}

export function rowsFromBench(bench: Bench, baselineName?: string): BenchRow[] {
    const tasks = bench.tasks.map((t) => ({
        name: t.name,
        opsPerSec: t.result?.hz ?? 0,
        averageTimeMs: t.result?.mean ?? 0,
        samples: t.result?.samples?.length ?? 0
    }))

    if (!baselineName) return tasks.map((t) => ({ ...t, relative: "" }))

    return tasks.map((t) => {
        if (t.name === baselineName) return { ...t, relative: "" }
        const baseline = tasks.find((x) => x.name === baselineName)
        if (!baseline || baseline.opsPerSec === 0) return { ...t, relative: "" }
        if (t.opsPerSec === 0) return { ...t, relative: "n/a" }
        const ratio = t.opsPerSec / baseline.opsPerSec
        const relative =
            ratio === 1
                ? "same"
                : ratio > 1
                  ? `${ratio.toFixed(2)} x faster`
                  : `${(1 / ratio).toFixed(2)} x slower`
        return { ...t, relative }
    })
}

export function writeTable(filename: string, header: string, rows: BenchRow[]) {
    const tableRows = rows.map((r) => [
        r.name,
        formatNumber(r.opsPerSec),
        r.averageTimeMs.toFixed(5),
        String(r.samples),
        r.relative ?? ""
    ])
    const md = getMarkdownTable({
        table: {
            head: ["Function", "ops/sec", "Average Time (ms)", "Samples", "Relative to SMT"],
            body: tableRows
        }
    })
    const out = `# ${header}\n\n${md}\n`
    const path = resolve(__dirname, "../../tables", filename)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, out)
    return out
}

function formatNumber(n: number): string {
    return Math.round(n).toLocaleString("en-US")
}

/**
 * Depths per SMT tree size:
 * 128 members (2^7) - depth 9
 * 512 members (2^9) - depth 11
 * 1024 members (2^10) - depth 12
 * 2048 members (2^11) - depth 13
 */
export const SIZES = [128, 512, 1024, 2048] as const
