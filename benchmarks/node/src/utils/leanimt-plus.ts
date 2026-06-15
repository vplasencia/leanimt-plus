import { LeanIMTPlus, LeanIMTPlusHashFunctions } from "../../../../browser/LeanIMTPlus/src"
import { poseidon2, poseidon3 } from "poseidon-lite"

const hashes: LeanIMTPlusHashFunctions<bigint> = {
    leaf: (a, b, c) => poseidon3([a, b, c]),
    internal: (a, b) => poseidon2([a, b])
}

export function newLeanIMTPlus(values: bigint[] = []): LeanIMTPlus<bigint> {
    return new LeanIMTPlus<bigint>(hashes, values)
}

export function fillLeanIMTPlus(size: number): LeanIMTPlus<bigint> {
    const values: bigint[] = []
    for (let i = 1; i <= size; i++) values.push(BigInt(i))
    return newLeanIMTPlus(values)
}
