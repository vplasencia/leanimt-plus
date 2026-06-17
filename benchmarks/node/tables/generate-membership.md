# Generate membership proof: LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT  |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ---------------- |
| SMT - Generate membership proof (tree size 128)       | 341       | 4.41209           | 100     |                  |
| LeanIMT+ - Generate membership proof (tree size 128)  | 1,509,627 | 0.00129           | 100     | 4422.71 x faster |
| SMT - Generate membership proof (tree size 512)       | 363       | 4.31055           | 100     |                  |
| LeanIMT+ - Generate membership proof (tree size 512)  | 1,929,461 | 0.00091           | 100     | 5322.55 x faster |
| SMT - Generate membership proof (tree size 1024)      | 470       | 2.23683           | 100     |                  |
| LeanIMT+ - Generate membership proof (tree size 1024) | 2,137,544 | 0.00088           | 100     | 4547.78 x faster |
| SMT - Generate membership proof (tree size 2048)      | 1,318     | 0.94601           | 100     |                  |
| LeanIMT+ - Generate membership proof (tree size 2048) | 2,861,108 | 0.00066           | 100     | 2170.93 x faster |
