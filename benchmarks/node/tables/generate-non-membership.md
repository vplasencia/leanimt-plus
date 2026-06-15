# Generate non-membership proof — LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate non-membership proof (tree size 128)       | 300       | 3.33346           | 150     |                   |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 9,407,645 | 0.00011           | 4703823 | 31359.99 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 22,716    | 0.04402           | 11359   |                   |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 8,742,936 | 0.00011           | 4371469 | 384.88 x faster   |
| SMT - Generate non-membership proof (tree size 1024)      | 20,046    | 0.04988           | 10024   |                   |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 8,096,549 | 0.00012           | 4048275 | 403.89 x faster   |
| SMT - Generate non-membership proof (tree size 2048)      | 18,554    | 0.05390           | 9277    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 8,735,835 | 0.00011           | 4367918 | 470.84 x faster   |
