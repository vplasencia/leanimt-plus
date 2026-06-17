# Generate non-membership proof: LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT  |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ---------------- |
| SMT - Generate non-membership proof (tree size 128)       | 345       | 4.39726           | 100     |                  |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 1,685,113 | 0.00113           | 100     | 4885.19 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 371       | 4.26332           | 100     |                  |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 1,874,024 | 0.00097           | 100     | 5055.08 x faster |
| SMT - Generate non-membership proof (tree size 1024)      | 470       | 2.24481           | 100     |                  |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 2,011,381 | 0.00088           | 100     | 4281.34 x faster |
| SMT - Generate non-membership proof (tree size 2048)      | 1,426     | 0.90586           | 100     |                  |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 2,562,365 | 0.00081           | 100     | 1797.15 x faster |
