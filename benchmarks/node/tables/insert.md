# Insert (single member) — LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 742     | 1.34802           | 20      |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,892   | 0.52846           | 20      | 2.55 x faster   |
| SMT - Insert (tree size 512)       | 665     | 1.50338           | 20      |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,990   | 0.50245           | 20      | 2.99 x faster   |
| SMT - Insert (tree size 1024)      | 617     | 1.62018           | 20      |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,970   | 0.50752           | 20      | 3.19 x faster   |
| SMT - Insert (tree size 2048)      | 573     | 1.74567           | 20      |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,956   | 0.51132           | 20      | 3.41 x faster   |
