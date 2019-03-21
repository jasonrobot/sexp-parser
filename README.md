# sexp-parser
Use Lisp s-expressions as a data format like JSON. Come on, you know you wanna.

This is an alternative to using JSON and works for many of the same usecases i.e. encoding data structures in strings for storage, transmission, or inspection.

This is what happens when you make a Lisp enthusiast write javascript all day.

Example comparison between JSON and s-expressions
```
{"number":123,"digits":["1","2","3"],"attributes":{"even":false,"positive":true}}
```
```
(:number 123 :digits ("1" "2" "3") :attributes (:even NIL :positive T))
```
```
{
  number: 123,
  digits: ['1', '2', '3'],
  attributes: {
    even: false,
    positive: true
  }
}
```
```
(:number 123
 :digits ("1" "2" "3")
 :attributes (:even NIL
              :positive T))
```

Technically, I'm implementing a subset of s-expressions, with specific semantics around key-value type data (a.k.a hashes, dictionaries, maps, named-tuples, etc.) They must be of the format:
```
(:key-1 value-1 :key-n value-n)
```
A list that does not match these semantics will be interpreted as an array (list, vector, sequence, etc.).

If an implementation language does not support symbols, the symbol will be encoded as a string, including a leading colon.
If an implementation language does not support hyphens in symbol names, they will be transcoded to underscores. (It might be nice to make this configurable in the future, as some languages "sorta" support them. Javascript can have hyphens in object keys as long as they are strings but can't have hyphens in variables, and I don't really want to cause problems with that down the line.)

## Why?

For fun, of course. When I just started programming, all data between servers and clients was XML. Then JSON was adopted widely for data transfer. It was more readable, more writable, and just felt right.

I think we can go one step further. Lisp has a very minimal syntax, and in some cases can even represent the same data in fewer bytes. JSON still frustrates me from time to time with its super strict syntax. Since I've been using Lisp a bit more, I thought this would be a cool way to bring some Lisp in to a world of javascript objects and php arrays.

Plus, I love playing with bunches of programming languages, and this gives me a chance to do just that!

## Supported Languages:
- Javascript
- Crystal
- PHP
- (Lisp is missing? Dude, wtf?)
- more to come!
