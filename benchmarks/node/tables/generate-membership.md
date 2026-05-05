# Generate membership proof — LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate membership proof (tree size 128)       | 255       | 3.92153           | 128     |                   |
| LeanIMT+ - Generate membership proof (tree size 128)  | 4,465,547 | 0.00022           | 2232774 | 17511.78 x faster |
| SMT - Generate membership proof (tree size 512)       | 8,197     | 0.12199           | 4099    |                   |
| LeanIMT+ - Generate membership proof (tree size 512)  | 2,178,354 | 0.00046           | 1089178 | 265.74 x faster   |
| SMT - Generate membership proof (tree size 1024)      | 23,203    | 0.04310           | 11602   |                   |
| LeanIMT+ - Generate membership proof (tree size 1024) | 1,210,954 | 0.00083           | 605477  | 52.19 x faster    |
| SMT - Generate membership proof (tree size 2048)      | 21,210    | 0.04715           | 10605   |                   |
| LeanIMT+ - Generate membership proof (tree size 2048) | 720,127   | 0.00139           | 360064  | 33.95 x faster    |
