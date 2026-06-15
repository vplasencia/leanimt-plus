# Verify membership proof — LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT   |
| --------------------------------------------------- | ------- | ----------------- | ------- | ----------------- |
| SMT - Verify membership proof (tree size 128)       | 450     | 2.22249           | 226     |                   |
| LeanIMT+ - Verify membership proof (tree size 128)  | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify membership proof (tree size 512)       | 329     | 3.03847           | 165     |                   |
| LeanIMT+ - Verify membership proof (tree size 512)  | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify membership proof (tree size 1024)      | 230     | 4.34421           | 117     |                   |
| LeanIMT+ - Verify membership proof (tree size 1024) | 0       | 0.00000           | 0       | Infinity x slower |
| SMT - Verify membership proof (tree size 2048)      | 253     | 3.95140           | 259     |                   |
| LeanIMT+ - Verify membership proof (tree size 2048) | 0       | 0.00000           | 0       | Infinity x slower |
