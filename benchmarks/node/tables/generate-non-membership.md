# Generate non-membership proof: LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate non-membership proof (tree size 128)       | 291       | 3.43413           | 148     |                   |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 9,159,453 | 0.00011           | 4579727 | 31454.75 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 22,042    | 0.04537           | 11022   |                   |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 8,689,491 | 0.00012           | 4344746 | 394.22 x faster   |
| SMT - Generate non-membership proof (tree size 1024)      | 19,756    | 0.05062           | 9878    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 8,622,388 | 0.00012           | 4311194 | 436.45 x faster   |
| SMT - Generate non-membership proof (tree size 2048)      | 18,798    | 0.05320           | 9400    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 8,578,521 | 0.00012           | 4289261 | 456.35 x faster   |
