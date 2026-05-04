pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// LeanIMTPlus proof verifier.
//
// Recomputes the Merkle root from a unified LeanIMT+ proof and enforces the
// proofType-specific check.
//
//   proofType = 0 (membership):     leafValue == value
//   proofType = 1 (non-membership): leafValue < value AND
//                                   (leafNextValue > value OR leafNextValue == 0)
//
// The Merkle walk follows the LeanIMT construction used in
// zk-kit's binary-merkle-root.circom: an unpaired right child is promoted
// unchanged, encoded by stopping the walk at `depth` rather than always
// climbing MAX_DEPTH levels.
template LeanIMTPlus(MAX_DEPTH) {
    signal input proofType;
    signal input value;
    signal input leafValue;
    signal input leafNextValue;
    signal input leafIndex;
    signal input depth;
    signal input siblings[MAX_DEPTH];

    signal output out;

    // proofType is boolean.
    proofType * (proofType - 1) === 0;

    // Membership: when proofType == 0, leafValue must equal value.
    (1 - proofType) * (leafValue - value) === 0;

    // Non-membership: leafValue < value AND (leafNextValue > value OR leafNextValue == 0).
    component ltLow = LessThan(252);
    ltLow.in[0] <== leafValue;
    ltLow.in[1] <== value;

    component ltHigh = LessThan(252);
    ltHigh.in[0] <== value;
    ltHigh.in[1] <== leafNextValue;

    component isTail = IsZero();
    isTail.in <== leafNextValue;

    // OR of two booleans: a + b - a*b.
    signal upperOr;
    upperOr <== ltHigh.out + isTail.out - ltHigh.out * isTail.out;

    signal nonMembOk;
    nonMembOk <== ltLow.out * upperOr;

    // proofType == 1 -> nonMembOk == 1.
    proofType * (nonMembOk - 1) === 0;

    // leafHash = Poseidon(leafValue, leafNextValue).
    component leafHash = Poseidon(2);
    leafHash.inputs[0] <== leafValue;
    leafHash.inputs[1] <== leafNextValue;

    // Path bits: LSB-first packing of leafIndex.
    component bits = Num2Bits(MAX_DEPTH);
    bits.in <== leafIndex;

    signal nodes[MAX_DEPTH + 1];
    nodes[0] <== leafHash.out;

    component mux[MAX_DEPTH];
    component hash[MAX_DEPTH];
    component isDepth[MAX_DEPTH];
    signal roots[MAX_DEPTH];
    var rootSum = 0;

    for (var i = 0; i < MAX_DEPTH; i++) {
        isDepth[i] = IsEqual();
        isDepth[i].in[0] <== depth;
        isDepth[i].in[1] <== i;
        roots[i] <== isDepth[i].out * nodes[i];
        rootSum += roots[i];

        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== nodes[i];
        mux[i].c[0][1] <== siblings[i];
        mux[i].c[1][0] <== siblings[i];
        mux[i].c[1][1] <== nodes[i];
        mux[i].s <== bits.out[i];

        hash[i] = Poseidon(2);
        hash[i].inputs[0] <== mux[i].out[0];
        hash[i].inputs[1] <== mux[i].out[1];
        nodes[i + 1] <== hash[i].out;
    }

    component isMaxDepth = IsEqual();
    isMaxDepth.in[0] <== depth;
    isMaxDepth.in[1] <== MAX_DEPTH;
    out <== rootSum + isMaxDepth.out * nodes[MAX_DEPTH];
}

component main {public [proofType, value]} = LeanIMTPlus(10);
