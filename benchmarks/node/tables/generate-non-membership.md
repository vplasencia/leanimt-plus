# Generate non-membership proof — LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate non-membership proof (tree size 128)       | 194       | 5.16163           | 98      |                   |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 6,304,933 | 0.00016           | 3152467 | 32543.72 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 16,779    | 0.05960           | 8390    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 6,829,959 | 0.00015           | 3414980 | 407.07 x faster   |
| SMT - Generate non-membership proof (tree size 1024)      | 14,148    | 0.07068           | 7075    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 6,596,230 | 0.00015           | 3298115 | 466.24 x faster   |
| SMT - Generate non-membership proof (tree size 2048)      | 12,627    | 0.07920           | 6315    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 6,699,608 | 0.00015           | 3349804 | 530.59 x faster   |
