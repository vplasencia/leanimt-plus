# Verify membership proof: LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| --------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify membership proof (tree size 128)       | 296     | 3.38112           | 148     |                 |
| LeanIMT+ - Verify membership proof (tree size 128)  | 1,025   | 0.97553           | 513     | 3.47 x faster   |
| SMT - Verify membership proof (tree size 512)       | 249     | 4.02186           | 128     |                 |
| LeanIMT+ - Verify membership proof (tree size 512)  | 821     | 1.21793           | 411     | 3.30 x faster   |
| SMT - Verify membership proof (tree size 1024)      | 398     | 2.51243           | 200     |                 |
| LeanIMT+ - Verify membership proof (tree size 1024) | 748     | 1.33654           | 375     | 1.88 x faster   |
| SMT - Verify membership proof (tree size 2048)      | 423     | 2.36217           | 212     |                 |
| LeanIMT+ - Verify membership proof (tree size 2048) | 698     | 1.43171           | 350     | 1.65 x faster   |
