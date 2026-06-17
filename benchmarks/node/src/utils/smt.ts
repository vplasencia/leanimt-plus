// @iden3/js-merkletree is published as pure ESM, so we load it lazily from CJS.
let smtMod: typeof import("@iden3/js-merkletree") | undefined

export async function loadSMT() {
    if (!smtMod) {
        smtMod = await import("@iden3/js-merkletree")
    }
    return smtMod
}

/**
 * SMT depth per tree size (depth = log2(size) + 2):
 * 128 members (2^7) - depth 9
 * 512 members (2^9) - depth 11
 * 1024 members (2^10) - depth 12
 * 2048 members (2^11) - depth 13
 */
function smtDepth(size: number): number {
    return Math.ceil(Math.log2(size)) + 2
}

export async function newSMT(depth: number) {
    const { Merkletree, InMemoryDB } = await loadSMT()
    return new Merkletree(new InMemoryDB(new Uint8Array()), true, depth)
}

export async function fillSMT(size: number) {
    const tree = await newSMT(smtDepth(size))
    for (let i = 1; i <= size; i++) {
        await tree.add(BigInt(i), BigInt(i))
    }
    return tree
}
