# Generate non-membership proof: LeanIMT+ vs SMT

| Function                                                  | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| --------------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate non-membership proof (tree size 128)       | 187       | 5.35013           | 95      |                   |
| LeanIMT+ - Generate non-membership proof (tree size 128)  | 6,401,710 | 0.00016           | 3200855 | 34249.98 x faster |
| SMT - Generate non-membership proof (tree size 512)       | 15,681    | 0.06377           | 7842    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 512)  | 6,478,173 | 0.00015           | 3239150 | 413.13 x faster   |
| SMT - Generate non-membership proof (tree size 1024)      | 13,922    | 0.07183           | 6961    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 1024) | 6,326,670 | 0.00016           | 3163336 | 454.45 x faster   |
| SMT - Generate non-membership proof (tree size 2048)      | 12,558    | 0.07963           | 6280    |                   |
| LeanIMT+ - Generate non-membership proof (tree size 2048) | 6,669,967 | 0.00015           | 3334984 | 531.13 x faster   |
