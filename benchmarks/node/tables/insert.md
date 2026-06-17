# Insert (single member): LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 65      | 15.43670          | 20      |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,853   | 0.53976           | 20      | 28.60 x faster  |
| SMT - Insert (tree size 512)       | 225     | 4.45254           | 20      |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,868   | 0.53525           | 20      | 8.32 x faster   |
| SMT - Insert (tree size 1024)      | 206     | 4.85595           | 20      |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,664   | 0.60100           | 20      | 8.08 x faster   |
| SMT - Insert (tree size 2048)      | 187     | 5.34299           | 20      |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,833   | 0.54559           | 20      | 9.79 x faster   |
