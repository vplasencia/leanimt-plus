# Verify non-membership proof: LeanIMT+ vs SMT

| Function                                                | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ------------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify non-membership proof (tree size 128)       | 339     | 3.20264           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 128)  | 4,259   | 0.23891           | 100     | 12.56 x faster  |
| SMT - Verify non-membership proof (tree size 512)       | 301     | 5.72146           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 512)  | 4,031   | 0.25027           | 100     | 13.41 x faster  |
| SMT - Verify non-membership proof (tree size 1024)      | 221     | 9.42727           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 1024) | 4,009   | 0.25436           | 100     | 18.16 x faster  |
| SMT - Verify non-membership proof (tree size 2048)      | 205     | 5.27255           | 100     |                 |
| LeanIMT+ - Verify non-membership proof (tree size 2048) | 3,790   | 0.27030           | 100     | 18.47 x faster  |
