# Verify non-membership proof — LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT   |
| ------------------------------------------------------- | ------- | ----------------- | ------- | ----------------- |
| SMT - Verify non-membership proof (tree size 128)       | 547     | 1.82867           | 274     |                   |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify non-membership proof (tree size 512)       | 497     | 2.01107           | 249     |                   |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify non-membership proof (tree size 1024)      | 552     | 1.81230           | 276     |                   |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify non-membership proof (tree size 2048)      | 770     | 1.29803           | 386     |                   |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 0       | 0.00000           | 0       | Infinity x slower |
