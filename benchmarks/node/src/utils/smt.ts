// @iden3/js-merkletree is published as pure ESM, so we load it lazily from CJS.
let smtMod: typeof import("@iden3/js-merkletree") | undefined

export async function loadSMT() {
    if (!smtMod) {
        smtMod = await import("@iden3/js-merkletree")
    }
    return smtMod
}

const SMT_DEPTH = 32

export async function newSMT() {
    const { Merkletree, InMemoryDB } = await loadSMT()
    return new Merkletree(new InMemoryDB(new Uint8Array()), true, SMT_DEPTH)
}

export async function fillSMT(size: number) {
    const tree = await newSMT()
    for (let i = 1; i <= size; i++) {
        await tree.add(BigInt(i), BigInt(i))
    }
    return tree
}
