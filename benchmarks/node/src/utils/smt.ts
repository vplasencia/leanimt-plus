import { Merkletree, InMemoryDB, str2Bytes, verifyProof } from "@iden3/js-merkletree"

export { verifyProof }

/**
 * SMT depth per tree size (depth = ceil(log2(size)) + 2):
 * 128 members (2^7) - depth 9
 * 512 members (2^9) - depth 11
 * 1024 members (2^10) - depth 12
 * 2048 members (2^11) - depth 13
 */
function smtDepth(size: number): number {
    return Math.ceil(Math.log2(size)) + 2
}

export function newSMT(depth: number) {
    return new Merkletree(new InMemoryDB(str2Bytes("Tree")), true, depth)
}

export async function fillSMT(size: number) {
    const tree = newSMT(smtDepth(size))
    for (let i = 1; i <= size; i++) {
        await tree.add(BigInt(i), BigInt(i))
    }
    return tree
}
