# Generate membership proof: LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate membership proof (tree size 128)       | 255       | 3.91751           | 128     |                   |
| LeanIMT+ - Generate membership proof (tree size 128)  | 7,380,886 | 0.00014           | 3690443 | 28914.68 x faster |
| SMT - Generate membership proof (tree size 512)       | 23,047    | 0.04339           | 11524   |                   |
| LeanIMT+ - Generate membership proof (tree size 512)  | 6,629,492 | 0.00015           | 3314746 | 287.65 x faster   |
| SMT - Generate membership proof (tree size 1024)      | 20,785    | 0.04811           | 10393   |                   |
| LeanIMT+ - Generate membership proof (tree size 1024) | 6,338,518 | 0.00016           | 3169259 | 304.96 x faster   |
| SMT - Generate membership proof (tree size 2048)      | 19,477    | 0.05134           | 9739    |                   |
| LeanIMT+ - Generate membership proof (tree size 2048) | 6,255,380 | 0.00016           | 3127691 | 321.16 x faster   |
