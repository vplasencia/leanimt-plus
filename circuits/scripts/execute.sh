#!/bin/bash

# Generates the full groth16 zk-artifacts (r1cs, wasm, zkey, verification key,
# proof, Solidity verifier) for every LeanIMT+ circuit depth in a range.
#
# The per-depth circuit files must already exist (run `yarn create:files
# <start> <end>` first, or use `yarn execute:all`).
#
# Usage: ./scripts/execute.sh [start] [end] [ptau]

# Start of the tree-depth range
START=2

# End of the tree-depth range
END=32

# Powers of tau file number. 2^14 = 16384 constraints covers LeanIMT+ up to
# depth 32 (~9441 non-linear constraints).
PTAU=14

# In case there is a start value as input
if [ "$1" ]; then
    START=$1
fi

# In case there is an end value as input
if [ "$2" ]; then
    END=$2
fi

# In case there is a ptau file number as input
if [ "$3" ]; then
    PTAU=$3
fi

echo "----- Remove build folder -----"
./scripts/remove-build-folder.sh

for ((i = $START; i <= $END; i++)); do
    echo "----- leanimt-plus-$i -----"
    ./scripts/execute-groth16.sh leanimt-plus-$i $PTAU
done
