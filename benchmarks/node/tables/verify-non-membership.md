# Verify non-membership proof — LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ------------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify non-membership proof (tree size 128)       | 308     | 3.24954           | 158     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 4,341   | 0.23035           | 2171    | 14.11 x faster  |
| SMT - Verify non-membership proof (tree size 512)       | 146     | 6.84984           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 4,144   | 0.24129           | 2073    | 28.39 x faster  |
| SMT - Verify non-membership proof (tree size 1024)      | 241     | 4.14758           | 121     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 4,363   | 0.22920           | 2182    | 18.10 x faster  |
| SMT - Verify non-membership proof (tree size 2048)      | 498     | 2.00727           | 250     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 4,372   | 0.22874           | 2186    | 8.78 x faster   |
