#!/usr/bin/env bash
# Compile LeanIMT+ and SMT verifier circuits at a sweep of depths and write a
# markdown table of non-linear constraint counts to tables/circuit-constraints.md.
#
# Both circuits use Poseidon as the underlying hash so counts are comparable.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CIRCOMLIB="$ROOT/../../circuits/node_modules/circomlib/circuits"
LEAN_SRC="$ROOT/../../circuits/circuits/leanimt-plus/leanimt-plus.circom"
BUILD="$ROOT/build"
TABLE="$ROOT/tables/circuit-constraints.md"

DEPTHS=(2 4 6 8 10 12 14 16 20 24 28 32)

mkdir -p "$BUILD" "$ROOT/tables"

# The shared LeanIMT+ source declares its own `component main`. Strip it so we
# can wrap the template at multiple depths without "two mains" errors.
LEAN_TEMPLATE="$BUILD/leanimt-plus.template.circom"
# Drop the upstream `component main` line and rewrite the relative includes
# (which assume the file lives at circuits/circuits/leanimt-plus/) to absolute
# paths so we can copy the template into the build dir.
sed -e '/^component main/d' \
    -e "s|\\.\\./\\.\\./node_modules/circomlib/circuits/|${CIRCOMLIB}/|g" \
    "$LEAN_SRC" > "$LEAN_TEMPLATE"

constraint_count() { grep -E "^non-linear constraints:" "$1" | awk '{print $3}'; }

{
    echo "# Circuit constraints — LeanIMT+ vs SMT (Poseidon)"
    echo
    echo "Non-linear constraint counts of the verifier circuits at varying tree depths."
    echo
    echo "| Depth | LeanIMT+ | SMT | Difference (SMT − LeanIMT+) | Ratio (SMT / LeanIMT+) |"
    echo "| ----- | -------- | --- | --------------------------- | ---------------------- |"
} > "$TABLE"

for d in "${DEPTHS[@]}"; do
    echo "==> depth $d"

    lean_wrapper="$BUILD/leanimt-plus-d${d}.circom"
    cat > "$lean_wrapper" <<EOF
pragma circom 2.0.0;
include "${LEAN_TEMPLATE}";
component main = LeanIMTPlus(${d});
EOF

    smt_wrapper="$BUILD/smt-verifier-d${d}.circom"
    cat > "$smt_wrapper" <<EOF
pragma circom 2.0.0;
include "${CIRCOMLIB}/smt/smtverifier.circom";
component main = SMTVerifier(${d});
EOF

    lean_log="$BUILD/leanimt-plus-d${d}.log"
    smt_log="$BUILD/smt-verifier-d${d}.log"

    circom "$lean_wrapper" --r1cs -l "$CIRCOMLIB/.." -o "$BUILD" > "$lean_log"
    circom "$smt_wrapper" --r1cs -l "$CIRCOMLIB/.." -o "$BUILD" > "$smt_log"

    lean=$(constraint_count "$lean_log")
    smt=$(constraint_count "$smt_log")
    diff=$((smt - lean))
    ratio=$(awk -v s="$smt" -v l="$lean" 'BEGIN { printf("%.2f", s/l) }')

    echo "| $d | $lean | $smt | $diff | $ratio |" >> "$TABLE"
    echo "  depth=$d  LeanIMT+=$lean  SMT=$smt  ratio=$ratio"
done

echo
echo "Wrote $TABLE"
