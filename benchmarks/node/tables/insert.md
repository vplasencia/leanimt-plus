# Insert (single member) — LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 46      | 21.87346          | 20      |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,305   | 0.76638           | 20      | 28.54 x faster  |
| SMT - Insert (tree size 512)       | 55      | 18.15224          | 20      |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,292   | 0.77385           | 20      | 23.46 x faster  |
| SMT - Insert (tree size 1024)      | 131     | 7.60723           | 20      |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,253   | 0.79809           | 20      | 9.53 x faster   |
| SMT - Insert (tree size 2048)      | 127     | 7.87304           | 20      |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,281   | 0.78040           | 20      | 10.09 x faster  |
