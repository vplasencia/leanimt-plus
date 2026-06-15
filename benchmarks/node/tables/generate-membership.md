# Generate membership proof — LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate membership proof (tree size 128)       | 248       | 4.03299           | 124     |                   |
| LeanIMT+ - Generate membership proof (tree size 128)  | 7,463,965 | 0.00013           | 3731983 | 30102.06 x faster |
| SMT - Generate membership proof (tree size 512)       | 23,061    | 0.04336           | 11531   |                   |
| LeanIMT+ - Generate membership proof (tree size 512)  | 6,983,683 | 0.00014           | 3491842 | 302.84 x faster   |
| SMT - Generate membership proof (tree size 1024)      | 20,722    | 0.04826           | 10362   |                   |
| LeanIMT+ - Generate membership proof (tree size 1024) | 6,527,996 | 0.00015           | 3263999 | 315.03 x faster   |
| SMT - Generate membership proof (tree size 2048)      | 16,881    | 0.05924           | 8441    |                   |
| LeanIMT+ - Generate membership proof (tree size 2048) | 5,832,298 | 0.00017           | 2916149 | 345.50 x faster   |
