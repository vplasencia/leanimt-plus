#!/bin/bash

echo "----- Remove build folder -----"
./scripts/remove-build-folder.sh

echo "----- Sudoku -----"
echo "----- Sudoku Groth16 -----"
./scripts/execute-groth16.sh sudoku 13
echo "----- Sudoku Plonk -----"
./scripts/execute-plonk.sh sudoku 15
echo "----- Sudoku Fflonk -----"
./scripts/execute-fflonk.sh sudoku 18

