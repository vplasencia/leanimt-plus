# Generate membership proof — LeanIMT+ vs SMT

| Function                                              | ops/sec   | Average Time (ms) | Samples | Relative to SMT   |
| ----------------------------------------------------- | --------- | ----------------- | ------- | ----------------- |
| SMT - Generate membership proof (tree size 128)       | 156       | 6.41946           | 78      |                   |
| LeanIMT+ - Generate membership proof (tree size 128)  | 4,769,843 | 0.00021           | 2384922 | 30619.80 x faster |
| SMT - Generate membership proof (tree size 512)       | 16,858    | 0.05932           | 8429    |                   |
| LeanIMT+ - Generate membership proof (tree size 512)  | 5,297,485 | 0.00019           | 2648743 | 314.25 x faster   |
| SMT - Generate membership proof (tree size 1024)      | 19,243    | 0.05197           | 9622    |                   |
| LeanIMT+ - Generate membership proof (tree size 1024) | 4,820,667 | 0.00021           | 2410388 | 250.52 x faster   |
| SMT - Generate membership proof (tree size 2048)      | 13,758    | 0.07269           | 6879    |                   |
| LeanIMT+ - Generate membership proof (tree size 2048) | 4,707,191 | 0.00021           | 2353596 | 342.15 x faster   |
