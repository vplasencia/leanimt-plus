# circuits — Circom verifier circuits for LeanIMT+

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
- **`circom`** 2.x on `$PATH` — install via
  [docs.circom.io](https://docs.circom.io/getting-started/installation/).
- **`snarkjs`** — used for setup, proving, and verification:
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

The suites cover every documented security guard — zero-value rejection,
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

`yarn execute` runs an end-to-end demo across all three proving systems
sequentially — useful as a smoke test of your local toolchain.

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
│   ├── execute.sh                   # full demo
│   ├── execute-groth16.sh
│   ├── execute-plonk.sh
│   ├── execute-fflonk.sh
│   ├── regenerate-inputs.ts         # rewrite the canonical input.json
│   └── remove-build-folder.sh
└── build/                           # generated; gitignored
```

## See also

- Security audit: [`../SECURITY_AUDIT.md`](../SECURITY_AUDIT.md)
- zkbugs cross-reference: [`../AUDIT_ZKBUGS.md`](../AUDIT_ZKBUGS.md)
- TS reference implementation: [`../browser/LeanIMTPlus/src/`](../browser/LeanIMTPlus/src/)
- Circuit constraint benchmarks vs SMT: [`../benchmarks/circuits/`](../benchmarks/circuits/)
