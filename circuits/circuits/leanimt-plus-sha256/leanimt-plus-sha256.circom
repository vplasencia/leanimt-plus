pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/sha256/sha256_2.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// Hash two field elements with SHA-256 using circomlib's `Sha256_2`.
//
// Each input is encoded as a 216-bit big-endian integer; the two are
// concatenated into a 432-bit message with hardcoded SHA-256 padding inside
// `Sha256_2`. The output is the lower 216 bits of the digest. Skipping the
// general `Sha256(512)` wrapper saves the padding and length-handling
// constraints. Inputs (user values and sibling hashes) must fit in 216 bits.

// SHA-256 variant of the LeanIMT+ proof verifier. See leanimt-plus.circom for
// the full description; the only difference is the hash used for both the
// leaf commitment and the internal Merkle nodes.
template LeanIMTPlusSha256(MAX_DEPTH) {
    signal input proofType;
    signal input value;
    signal input leafValue;
    signal input leafNextValue;
    signal input leafIndex;
    signal input depth;
    signal input siblings[MAX_DEPTH];

    signal output out;

    proofType * (proofType - 1) === 0;
    (1 - proofType) * (leafValue - value) === 0;

    component ltLow = LessThan(252);
    ltLow.in[0] <== leafValue;
    ltLow.in[1] <== value;

    component ltHigh = LessThan(252);
    ltHigh.in[0] <== value;
    ltHigh.in[1] <== leafNextValue;

    component isTail = IsZero();
    isTail.in <== leafNextValue;

    signal upperOr;
    upperOr <== ltHigh.out + isTail.out - ltHigh.out * isTail.out;

    signal nonMembOk;
    nonMembOk <== ltLow.out * upperOr;

    proofType * (nonMembOk - 1) === 0;

    component leafHash = Sha256_2();
    leafHash.a <== leafValue;
    leafHash.b <== leafNextValue;

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

        hash[i] = Sha256_2();
        hash[i].a <== mux[i].out[0];
        hash[i].b <== mux[i].out[1];
        nodes[i + 1] <== hash[i].out;
    }

    component isMaxDepth = IsEqual();
    isMaxDepth.in[0] <== depth;
    isMaxDepth.in[1] <== MAX_DEPTH;
    out <== rootSum + isMaxDepth.out * nodes[MAX_DEPTH];
}

component main {public [proofType, value]} = LeanIMTPlusSha256(10);
