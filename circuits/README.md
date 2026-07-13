# circuits: Circom verifier circuits for LeanIMT+

Two Circom 2 circuits that verify a unified LeanIMT+ proof (membership or
non-membership) against a root, plus a test suite that exercises them
through `circom_tester`.

| circuit | hash | location |
|---|---|---|
| `LeanIMTPlus` | Poseidon | [`circuits/leanimt-plus/leanimt-plus.circom`](circuits/leanimt-plus/leanimt-plus.circom) |
| `LeanIMTPlusSha256` | SHA-256 (via `Sha256_2`) | [`circuits/leanimt-plus-sha256/leanimt-plus-sha256.circom`](circuits/leanimt-plus-sha256/leanimt-plus-sha256.circom) |

Security model and the rationale for every constraint live in
[`../SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) and
[`../AUDIT_ZKBUGS.md`](../AUDIT_ZKBUGS.md).

---

## Prerequisites

- **Node.js** ≥ 18
- **`circom`** 2.x on `$PATH`. Install via
  [docs.circom.io](https://docs.circom.io/getting-started/installation/).
- **`snarkjs`**, used for setup, proving, and verification:
  ```bash
  npm install -g snarkjs
  ```

## Install dependencies

```bash
cd circuits
yarn        # or: npm install
```

This pulls in `circomlib`, `circom_tester`, `mocha`, `poseidon-lite`, and
the rest.

---

## Run the tests

```bash
# Yarn
yarn test

# Or directly (no Yarn needed)
npx tsx node_modules/mocha/bin/mocha.js tests/**/*.ts

# Just the Poseidon circuit
npx tsx node_modules/mocha/bin/mocha.js tests/leanimt-plus.test.ts

# Just the SHA-256 circuit
npx tsx node_modules/mocha/bin/mocha.js tests/leanimt-plus-sha256.test.ts
```

Current state: **27 tests, 0 failures**. The SHA-256 tests take ~10 s
because of the witness-generation cost; the Poseidon tests are sub-second.

The suites cover every documented security guard: zero-value rejection,
tombstone-replay rejection, out-of-range value rejection, non-canonical
`leafIndex` rejection, and the standard membership / non-membership /
tampered-proof cases.

---

## Regenerate the canonical inputs

Every circuit ships an `input.json` containing a fresh witness for a
known proof. Regenerate them from the current TS implementation:

```bash
npx tsx scripts/regenerate-inputs.ts
```

This rewrites:
- [`circuits/leanimt-plus/input.json`](circuits/leanimt-plus/input.json)
- [`circuits/leanimt-plus-sha256/input-sha256.json`](circuits/leanimt-plus-sha256/input-sha256.json)

Run after any change to the leaf hash, the TS tree, or the test
fixtures so the standalone Circom compile / prove flow stays in sync.

---

## Compile a circuit standalone

Each command takes the circuit subfolder name as an argument (so
`leanimt-plus` for Poseidon, `leanimt-plus-sha256` for SHA-256).

```bash
# Compile to .r1cs / .wasm / .sym
yarn compile leanimt-plus
yarn compile leanimt-plus-sha256
```

Outputs land in `build/<circuit>/`.

## Generate a witness

```bash
yarn generate:witness leanimt-plus
yarn generate:witness leanimt-plus-sha256
```

Uses the circuit's `input.json` (or `input-sha256.json`). Output:
`build/<circuit>/witness.wtns`.

## End-to-end: compile → setup → prove → verify

Three proving systems are wired up. Each script does the full pipeline
(compile, powers-of-tau download, key gen, witness, proof, verify):

```bash
yarn run:groth16 leanimt-plus
yarn run:plonk   leanimt-plus
yarn run:fflonk  leanimt-plus
```

Same with `leanimt-plus-sha256`. Each takes an optional second argument
for the `ptau` index (defaults: Groth16 = 13, Plonk = 15, Fflonk = 18).
A larger `ptau` is needed for the SHA-256 circuit (try 18+).

## Generate zk-artifacts for many tree depths (2 to 32)

To benchmark or ship proofs at different tree depths, generate a separate
circuit and full groth16 artifact set per depth. The source circuit is
parameterized by `MAX_DEPTH`; these scripts stamp out one circuit folder per
depth and run the groth16 pipeline over the whole range.

```bash
# One shot: remove old generated folders, create depths 2..32, build all.
yarn execute:all
```

`execute:all` is equivalent to:

```bash
# 1. Write circuits/leanimt-plus-<n>/{leanimt-plus-<n>.circom,input.json}
#    for every depth in the range. Each .circom is a small wrapper that
#    `include`s the audited template (../leanimt-plus/leanimt-plus.circom)
#    and instantiates `component main = LeanIMTPlus(<n>)`.
yarn create:files 2 32

# 2. Run the full groth16 pipeline (compile, ptau download, key gen, witness,
#    proof, verify, Solidity verifier) for leanimt-plus-2 .. leanimt-plus-32.
#    Optional args: <start> <end> <ptau> (defaults: 2 32 14).
yarn execute 2 32
```

Artifacts for each depth land under
`build/leanimt-plus-<n>/groth16/`, notably
`leanimt-plus-<n>_js/leanimt-plus-<n>.wasm` and
`leanimt-plus-<n>_final.zkey` (the two files a browser/prover needs).

`ptau` 14 (2^14 = 16384 constraints) covers the whole 2..32 range; the
deepest circuit is ~9.5k constraints. Remove just the generated circuit
folders (keeping the source circuits) with `yarn remove:circuits`.

## Clean

```bash
yarn remove:build
```

Wipes `build/`.

---

## Layout

```
circuits/
├── circuits/
│   ├── leanimt-plus/                # Poseidon variant
│   │   ├── leanimt-plus.circom
│   │   └── input.json
│   └── leanimt-plus-sha256/         # SHA-256 variant
│       ├── leanimt-plus-sha256.circom
│       └── input-sha256.json
├── tests/                           # circom_tester + Mocha
├── scripts/                         # build / prove / verify helpers
│   ├── compile.sh
│   ├── generate-witness.sh
│   ├── execute.sh                   # groth16 sweep over a depth range
│   ├── execute-groth16.sh
│   ├── execute-plonk.sh
│   ├── execute-fflonk.sh
│   ├── leanimt-plus-create-files.ts # stamp out per-depth circuits + inputs
│   ├── utils/
│   │   └── leanimt-plus-generate-text.ts
│   ├── regenerate-inputs.ts         # rewrite the canonical input.json
│   ├── remove-circuits-folder.sh    # delete generated per-depth folders
│   └── remove-build-folder.sh
├── circuits/leanimt-plus-<n>/       # generated per-depth; gitignored
└── build/                           # generated; gitignored
```

## See also

- Security audit: [`../SECURITY_AUDIT.md`](../SECURITY_AUDIT.md)
- zkbugs cross-reference: [`../AUDIT_ZKBUGS.md`](../AUDIT_ZKBUGS.md)
- TS reference implementation: [`../browser/LeanIMTPlus/src/`](../browser/LeanIMTPlus/src/)
- Circuit constraint benchmarks vs SMT: [`../benchmarks/circuits/`](../benchmarks/circuits/)
