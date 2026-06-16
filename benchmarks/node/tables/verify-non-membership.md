# Verify non-membership proof: LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ------------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify non-membership proof (tree size 128)       | 305     | 3.27420           | 153     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 4,470   | 0.22369           | 2236    | 14.64 x faster  |
| SMT - Verify non-membership proof (tree size 512)       | 147     | 6.82534           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 4,408   | 0.22684           | 2205    | 30.09 x faster  |
| SMT - Verify non-membership proof (tree size 1024)      | 224     | 4.47083           | 112     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 4,441   | 0.22517           | 2221    | 19.86 x faster  |
| SMT - Verify non-membership proof (tree size 2048)      | 524     | 1.90840           | 263     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 4,399   | 0.22732           | 2200    | 8.40 x faster   |
