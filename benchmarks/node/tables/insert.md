# Insert (single member) — LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 63      | 15.81104          | 20      |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,844   | 0.54232           | 20      | 29.15 x faster  |
| SMT - Insert (tree size 512)       | 85      | 11.82115          | 20      |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,885   | 0.53056           | 20      | 22.28 x faster  |
| SMT - Insert (tree size 1024)      | 196     | 5.10732           | 20      |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,820   | 0.54939           | 20      | 9.30 x faster   |
| SMT - Insert (tree size 2048)      | 187     | 5.34334           | 20      |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,804   | 0.55444           | 20      | 9.64 x faster   |
