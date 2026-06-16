# Generate membership proof: LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate membership proof (tree size 128)       | 148       | 6.77926           | 74      |                   |
| LeanIMT+ - Generate membership proof (tree size 128)  | 5,096,551 | 0.00020           | 2548276 | 34550.85 x faster |
| SMT - Generate membership proof (tree size 512)       | 15,913    | 0.06284           | 7957    |                   |
| LeanIMT+ - Generate membership proof (tree size 512)  | 5,151,000 | 0.00019           | 2575500 | 323.69 x faster   |
| SMT - Generate membership proof (tree size 1024)      | 13,857    | 0.07217           | 6929    |                   |
| LeanIMT+ - Generate membership proof (tree size 1024) | 4,786,569 | 0.00021           | 2393290 | 345.43 x faster   |
| SMT - Generate membership proof (tree size 2048)      | 12,845    | 0.07785           | 6423    |                   |
| LeanIMT+ - Generate membership proof (tree size 2048) | 4,529,744 | 0.00022           | 2264872 | 352.64 x faster   |
