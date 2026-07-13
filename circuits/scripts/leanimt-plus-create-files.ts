import { mkdirSync, writeFileSync } from "fs"
import {
  createCircuitCode,
  createInput
} from "./utils/leanimt-plus-generate-text"

// Generates one circuit folder per tree depth:
//   circuits/leanimt-plus-<n>/leanimt-plus-<n>.circom
//   circuits/leanimt-plus-<n>/input.json
//
// Usage: tsx ./scripts/leanimt-plus-create-files.ts <start> <end>
if (process.argv.length === 4) {
  const start = Number(process.argv[2])
  const end = Number(process.argv[3])

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
    console.error("Both arguments must be integers with start <= end.")
    process.exit(1)
  }

  for (let i = start; i <= end; i += 1) {
    mkdirSync(`./circuits/leanimt-plus-${i}`, { recursive: true })
    writeFileSync(
      `circuits/leanimt-plus-${i}/leanimt-plus-${i}.circom`,
      createCircuitCode(i)
    )
    writeFileSync(`circuits/leanimt-plus-${i}/input.json`, createInput(i))
  }

  console.log(
    `Created leanimt-plus circuits and inputs for depths ${start} to ${end}`
  )
} else {
  console.error("Expected two arguments: <start> <end>")
  process.exit(1)
}
