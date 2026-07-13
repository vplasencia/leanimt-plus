#!/bin/bash

# Remove the generated per-depth circuit folders (circuits/leanimt-plus-<n>),
# leaving the source circuits (leanimt-plus, leanimt-plus-sha256) untouched.
rm -r -f circuits/leanimt-plus-[0-9]*
