// Adapter for consuming the LeanIMT+ reference implementation in
// `browser/LeanIMTPlus` from these (ESM) Hardhat tests. It exists purely to bridge
// two module-system quirks, without modifying the reference:
//
//   1. The reference is authored as a CommonJS TypeScript module (the `browser`
//      package has no `"type": "module"`). Under Hardhat's `tsx` loader, importing
//      its `export default class` yields the CJS `module.exports` object rather than
//      the class, so we unwrap `.default` when needed.
//   2. We import the concrete `leanimt-plus` module directly instead of the package
//      barrel `index.ts`, because the barrel's `export * from "./types"` forces the
//      loader to resolve the `types` *directory*, which its CommonJS resolver will
//      not map to `types/index.ts`. The class's own `./types` import is type-only
//      and elided at runtime, and the default AVL index resolves transitively from
//      `browser/node_modules` (so no dependency is added to this package).
import LeanIMTPlusDefault from "../../browser/LeanIMTPlus/src/leanimt-plus"

type Ctor = typeof import("../../browser/LeanIMTPlus/src/leanimt-plus").default

const resolved = LeanIMTPlusDefault as unknown as Ctor | { default: Ctor }

export const LeanIMTPlus = (
  typeof resolved === "function" ? resolved : resolved.default
) as Ctor

export type {
  LeanIMTPlusHashFunctions,
  LeanIMTPlusProof,
  LeanIMTPlusLeaf
} from "../../browser/LeanIMTPlus/src/types/index"
