# Generate non-membership proof — LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT  |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ---------------- |
| SMT - Generate non-membership proof (tree size 128)       | 285       | 3.50866           | 144     |                  |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 1,965,005 | 0.00051           | 982503  | 6894.54 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 21,872    | 0.04572           | 10936   |                  |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 608,714   | 0.00164           | 304358  | 27.83 x faster   |
| SMT - Generate non-membership proof (tree size 1024)      | 19,983    | 0.05004           | 9992    |                  |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 311,787   | 0.00321           | 155894  | 15.60 x faster   |
| SMT - Generate non-membership proof (tree size 2048)      | 3,604     | 0.27748           | 1804    |                  |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 149,942   | 0.00667           | 74971   | 41.61 x faster   |
