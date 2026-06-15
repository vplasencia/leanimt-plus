# Verify membership proof — LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| --------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify membership proof (tree size 128)       | 306     | 3.27041           | 153     |                 |
| LeanIMT+ - Verify membership proof (tree size 128)  | 1,012   | 0.98816           | 506     | 3.31 x faster   |
| SMT - Verify membership proof (tree size 512)       | 217     | 4.61102           | 124     |                 |
| LeanIMT+ - Verify membership proof (tree size 512)  | 832     | 1.20261           | 416     | 3.83 x faster   |
| SMT - Verify membership proof (tree size 1024)      | 379     | 2.63942           | 190     |                 |
| LeanIMT+ - Verify membership proof (tree size 1024) | 737     | 1.35770           | 369     | 1.94 x faster   |
| SMT - Verify membership proof (tree size 2048)      | 428     | 2.33657           | 214     |                 |
| LeanIMT+ - Verify membership proof (tree size 2048) | 682     | 1.46611           | 342     | 1.59 x faster   |
