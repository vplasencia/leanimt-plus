# Verify membership proof: LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| --------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify membership proof (tree size 128)       | 461     | 2.16988           | 231     |                 |
| LeanIMT+ - Verify membership proof (tree size 128)  | 1,397   | 0.71575           | 699     | 3.03 x faster   |
| SMT - Verify membership proof (tree size 512)       | 420     | 2.37831           | 211     |                 |
| LeanIMT+ - Verify membership proof (tree size 512)  | 1,193   | 0.83811           | 597     | 2.84 x faster   |
| SMT - Verify membership proof (tree size 1024)      | 538     | 1.85974           | 269     |                 |
| LeanIMT+ - Verify membership proof (tree size 1024) | 1,076   | 0.92950           | 538     | 2.00 x faster   |
| SMT - Verify membership proof (tree size 2048)      | 229     | 4.35919           | 220     |                 |
| LeanIMT+ - Verify membership proof (tree size 2048) | 983     | 1.01721           | 492     | 4.29 x faster   |
