# Verify membership proof: LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| --------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify membership proof (tree size 128)       | 389     | 2.70972           | 100     |                 |
| LeanIMT+ - Verify membership proof (tree size 128)  | 1,020   | 0.99799           | 100     | 2.62 x faster   |
| SMT - Verify membership proof (tree size 512)       | 302     | 7.70484           | 100     |                 |
| LeanIMT+ - Verify membership proof (tree size 512)  | 785     | 1.27649           | 100     | 2.60 x faster   |
| SMT - Verify membership proof (tree size 1024)      | 219     | 13.83326          | 100     |                 |
| LeanIMT+ - Verify membership proof (tree size 1024) | 706     | 1.43109           | 100     | 3.22 x faster   |
| SMT - Verify membership proof (tree size 2048)      | 206     | 5.13344           | 100     |                 |
| LeanIMT+ - Verify membership proof (tree size 2048) | 643     | 1.57325           | 100     | 3.13 x faster   |
