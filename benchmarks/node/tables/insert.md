# Insert (single member): LeanIMT+ vs SMT

| Function                           | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| ---------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Insert (tree size 128)       | 44      | 22.90166          | 20      |                 |
| LeanIMT+ - Insert (tree size 128)  | 1,264   | 0.79111           | 20      | 28.95 x faster  |
| SMT - Insert (tree size 512)       | 54      | 18.40005          | 20      |                 |
| LeanIMT+ - Insert (tree size 512)  | 1,270   | 0.78719           | 20      | 23.37 x faster  |
| SMT - Insert (tree size 1024)      | 139     | 7.18056           | 20      |                 |
| LeanIMT+ - Insert (tree size 1024) | 1,176   | 0.85062           | 20      | 8.44 x faster   |
| SMT - Insert (tree size 2048)      | 132     | 7.57061           | 20      |                 |
| LeanIMT+ - Insert (tree size 2048) | 1,284   | 0.77896           | 20      | 9.72 x faster   |
