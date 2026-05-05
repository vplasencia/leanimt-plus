import { LeanIMTPlus } from "../../../../browser/LeanIMTPlus/src"
import { poseidon2 } from "poseidon-lite"

const hash = (a: bigint, b: bigint) => poseidon2([a, b])

export function newLeanIMTPlus(values: bigint[] = []): LeanIMTPlus<bigint> {
    return new LeanIMTPlus<bigint>(hash, values)
}

export function fillLeanIMTPlus(size: number): LeanIMTPlus<bigint> {
    const values: bigint[] = []
    for (let i = 1; i <= size; i++) values.push(BigInt(i))
    return newLeanIMTPlus(values)
}
