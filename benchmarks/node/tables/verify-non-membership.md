# Verify non-membership proof — LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ------------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify non-membership proof (tree size 128)       | 457     | 2.18855           | 231     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 6,698   | 0.14930           | 3349    | 14.66 x faster  |
| SMT - Verify non-membership proof (tree size 512)       | 157     | 6.36189           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 6,915   | 0.14460           | 3458    | 44.00 x faster  |
| SMT - Verify non-membership proof (tree size 1024)      | 160     | 6.26746           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 6,812   | 0.14680           | 3407    | 42.69 x faster  |
| SMT - Verify non-membership proof (tree size 2048)      | 170     | 5.89128           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 6,851   | 0.14595           | 3429    | 40.36 x faster  |
