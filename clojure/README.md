# sexp-parser

Clojure version of sexp-parser. Uses EDN under the hood, so this may
support more features than it should. That may change in the future,
so don't rely on it. And if it's not clear what should be supported,
drop me a line.

## Usage

```
(encode [1 2 [:a 1 b: [:c 2 :d ["foo bar" "baz"]]]])
```

```
(parse "(1 2 (:a 1 :b (:c 2 :d (\"foo bar\" \"baz\"))))")
```

## License

Copyright © 2019 Jason Howell

Distributed under the GNU GPL v3
