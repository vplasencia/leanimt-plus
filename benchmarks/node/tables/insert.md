# Insert (single member): LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 107     | 10.59518          | 100     |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,040   | 0.98825           | 100     | 9.75 x faster   |
| SMT - Insert (tree size 512)       | 92      | 10.97743          | 100     |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,042   | 0.97914           | 100     | 11.31 x faster  |
| SMT - Insert (tree size 1024)      | 83      | 12.19993          | 100     |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,052   | 0.97527           | 100     | 12.74 x faster  |
| SMT - Insert (tree size 2048)      | 406     | 2.46533           | 100     |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,094   | 0.93463           | 100     | 2.69 x faster   |
