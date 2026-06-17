# Verify non-membership proof: LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ------------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify non-membership proof (tree size 128)       | 473     | 2.11487           | 237     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 6,149   | 0.16264           | 3075    | 13.00 x faster  |
| SMT - Verify non-membership proof (tree size 512)       | 156     | 6.39267           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 6,308   | 0.15853           | 3154    | 40.32 x faster  |
| SMT - Verify non-membership proof (tree size 1024)      | 149     | 6.69725           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 6,259   | 0.15977           | 3130    | 41.92 x faster  |
| SMT - Verify non-membership proof (tree size 2048)      | 170     | 5.89374           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 6,140   | 0.16287           | 3070    | 36.19 x faster  |
