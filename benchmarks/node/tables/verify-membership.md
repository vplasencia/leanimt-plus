# Verify membership proof — LeanIMT+ vs SMT

| Function                                            | ops/sec | Average Time (ms) | Samples | Relative to SMT |
| --------------------------------------------------- | ------- | ----------------- | ------- | --------------- |
| SMT - Verify membership proof (tree size 128)       | 450     | 2.22351           | 225     |                 |
| LeanIMT+ - Verify membership proof (tree size 128)  | 1,432   | 0.69816           | 717     | 3.18 x faster   |
| SMT - Verify membership proof (tree size 512)       | 416     | 2.40592           | 208     |                 |
| LeanIMT+ - Verify membership proof (tree size 512)  | 1,171   | 0.85432           | 586     | 2.82 x faster   |
| SMT - Verify membership proof (tree size 1024)      | 347     | 2.88338           | 271     |                 |
| LeanIMT+ - Verify membership proof (tree size 1024) | 1,054   | 0.94853           | 528     | 3.04 x faster   |
| SMT - Verify membership proof (tree size 2048)      | 276     | 3.62457           | 274     |                 |
| LeanIMT+ - Verify membership proof (tree size 2048) | 977     | 1.02322           | 489     | 3.54 x faster   |
