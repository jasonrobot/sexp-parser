(ns sexp-parser.core-test
  (:require [clojure.test :refer :all]
            [sexp-parser.core :refer :all]))

(deftest parse-bool?-test
  (is (= (:data (parse-bool? "T" 0)) true))
  (is (= (:data (parse-bool? "NIL" 0)) false)))

(deftest parse-string?-test
  (is (= (:data (parse-string? "\"asdf\"" 0)) "asdf"))
  (is (= (:next (parse-string? "\"asdf\"" 0)) 6))

  (is (= (:data (parse-string? "\"asdf\")" 0)) "asdf") "parse string \"asdf)\" data")
  (is (= (:next (parse-string? "\"asdf\")" 0)) 6) "parse string \"asdf)\" next")

  (is (= (:data (parse-string? "'asdf'" 0)) nil) "string with single quotes")
  (is (= (:data (parse-string? "\"\\\"\"" 0)) "\"") "an escaped quote")
  (is (= (:data (parse-string? "\"\\\")" 0)) "\\") "single literal backslash"))

(deftest parse-symbol?-test
  (is (= (:data (parse-symbol? ":foo" 0)) :foo) "symbol data")
  (is (= (:next (parse-symbol? ":foo" 0)) 4) "symbol length")

  (is (= (:data (parse-symbol? ":bar)" 0)) :bar) "symbol data trailing paren")
  (is (= (:next (parse-symbol? ":bar)" 0)) 4) "symbol next trailing paren")

  (is (= (:data (parse-symbol? ":cAsEsEnSiTiVe" 0)) :cAsEsEnSiTiVe)
      "should preserve case")
  (is (= (:data (parse-symbol? "asdf" 0)) nil) "symbol without colon" ))

(deftest parse-number?-test
  (is (== (:data (parse-number? "12" 0)) 12) "data 12")
  (is (= (:next (parse-number? "12" 0)) 2) "length 12 is 2")

  (is (== (:data (parse-number? "-1" 0)) -1) "data -1")
  (is (= (:next (parse-number? "-2" 0)) 2) "length -1 is 2")

  (is (== (:data (parse-number? "0.5" 0)) 0.5) "data 0.5")
  (is (= (:next (parse-number? "0.5" 0)) 3) "length 0.5 is 3")

  (is (== (:data (parse-number? ".5" 0)) 0.5) "data .5")
  (is (= (:next (parse-number? ".5" 0)) 2) "length .5 is 2")

  (is (== (:data (parse-number? "-0.5" 0)) -0.5) "data -0.5")
  (is (= (:next (parse-number? "-0.5" 0)) 4) "length -0.5 is 4")

  ;; (is (== (:data (parse-number? "foo 12 bar" 0)) 12) "data \"foo 12 bar\" is 12")
  ;; (is (= (:next (parse-number? "foo 12 bar" 0)) 6) "length \"foo 12 bar\" is 6")

  (is (== (:data (parse-number? "2)" 0)) 2) "trailing paren")
  (is (= (:next (parse-number? "2)" 0)) 1) "trailing paren length"))

(deftest parse-sexp?-test
  (is (= (:data (parse-sexp? "(1 2 3)" 0)) [1 2 3]))
  (is (= (:next (parse-sexp? "(1 2 3)" 0)) 7))

  (is (= (:data (parse-sexp? "()" 0)) []))
  (is (= (:next (parse-sexp? "()" 0)) 2))

  (is (= (:data (parse-sexp? "(1 (2 3) 4)" 0)) [1 [2 3] 4]))
  (is (= (:next (parse-sexp? "(1 (2 3) 4)" 0)) 11));

  (is (= (:data (parse-sexp? "(())" 0)) [[]]))
  (is (= (:next (parse-sexp? "(())" 0)) 4))

  (is (= (:data (parse-sexp? "( ( ) )" 0)) [[]]))
  (is (= (:next (parse-sexp? "( ( ) )" 0)) 7))

  (is (= (:data (parse-sexp? "(() () ())" 0)) [[] [] []]))
  (is (= (:data (parse-sexp? "( ( 2 ) 3)" 0)) [[2] 3]))

  (testing "key value objects"
    (is (= (:data (parse-sexp? "(:a 1)" 0)) {:a 1}))
    (is (= (:data (parse-sexp? "(:foo 123 :bar \"asd\")" 0)) {:foo 123 :bar "asd"}))
    (is (= (:data (parse-sexp? "(:a (:b (:c 69)))" 0)) {:a {:b {:c 69}}}))))

;; Are these internal?

;; test( 'tryParseObject', ( t ) => {
;; let array = [':foo', 123, ':bar', 'asd'];
;; let expected = { foo: 123, bar: 'asd' };
;; t.deepEqual( tryParseObject( array ), expected );

;; array = [ ':A', [ ':B', [ ':C', 69 ] ] ];
;; expected = { A: [ ':B', [ ':C', 69 ] ] };
;; t.deepEqual( tryParseObject( array ), expected,
;; 'should only do the first level of an array' );

(deftest chomp-whitespace-test
  (is (= (chomp-whitespace " a" 0) 1)))

(deftest find-end-of-symbol-test
  (is (= (find-end-of-symbol "a " 0) 1)))

(deftest parens-balanced?-test
  (is (= (parens-balanced? "()") true))
  (is (= (parens-balanced? "(()()(()))") true))
  (is (= (parens-balanced? "(works (with ( stuff )in )between )") true))
  (is (= (parens-balanced? ")(") false))
  (is (= (parens-balanced? "(())))(((())") false))
  (is (= (parens-balanced? "(") false))
  (is (= (parens-balanced? ")") false))
  (is (= (parens-balanced? "())") false))
  (is (= (parens-balanced? "(()") false)))

(deftest quotes-balanced?-test
  (is (= (quotes-balanced? "") true))
  (is (= (quotes-balanced? "\"\"") true))
  (is (= (quotes-balanced? "\"\"\"") false)))

(deftest encode-atom-test
  (is (= (encode-atom "asd") "\"asd\""))
  (is (= (encode-atom 69) "69"))

  (is (= (encode-atom true) "T"))
  (is (= (encode-atom false) "NIL")))

(deftest encode-array-test
  (is (= (encode-array []) "()"))
  (is (= (encode-array [1 2 3]) "(1 2 3)"))
  (is (= (encode-array [[1 2] [3 4]]) "((1 2) (3 4))")))

(deftest encode-test
  (is (= (encode {:number 123,
                  :digits ["1" "2" "3"]
                  :attributes {:even false
                               :positive true}})
         "(:number 123 :digits (\"1\" \"2\" \"3\") :attributes (:even NIL :positive T))")))

;; TODO
;; test( 'large round trip test', ( t ) => {
;; const largeDataPayload = [
;; {
;; "_id": "5c77256b120e71539a4543a7",
;; "index": 0,
;; "guid": "c9815eb2-fdc5-42f8-bbb3-c2dadaf4c1b8",
;; "isActive": true,
;; "balance": "$1,556.23",
;; "picture": "http://placehold.it/32x32",
;; "age": 40,
;; "eyeColor": "brown",
;; "name": "Dora Weiss",
;; "gender": "female",
;; "company": "CIRCUM",
;; "email": "doraweiss@circum.com",
;; "phone": "+1 (957) 431-3727",
;; "address": "219 Chase Court, Hebron, New Jersey, 6091",
;; "about": "Quis ipsum eu deserunt ut mollit est eu duis commodo reprehenderit cupidatat nulla ad aliquip. Tempor nulla in consequat est voluptate veniam excepteur pariatur sunt sint. Veniam laborum aliqua esse elit qui est exercitation velit. Mollit qui exercitation nulla elit ex ad aute laborum reprehenderit. Quis ipsum proident velit do. Dolor dolore incididunt aliquip culpa cillum enim. Id incididunt ullamco aliquip id mollit elit ullamco qui duis ut mollit.\r\n",
;; "registered": "2014-08-01T12:47:41 +07:00",
;; "latitude": -82.633003,
;; "longitude": 4.637068,
;; "tags": [
;; "fugiat",
;; "eu",
;; "Lorem",
;; "laborum",
;; "fugiat",
;; "pariatur",
;; "ex"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Lynette Mccarthy"
;; },
;; {
;; "id": 1,
;; "name": "Leila Medina"
;; },
;; {
;; "id": 2,
;; "name": "Kasey Moss"
;; }
;; ],
;; "greeting": "Hello, Dora Weiss! You have 9 unread messages.",
;; "favoriteFruit": "banana"
;; },
;; {
;; "_id": "5c77256ba6e9551c135fc72f",
;; "index": 1,
;; "guid": "ec2b621f-e35a-4447-9ecb-c3bee2feeeea",
;; "isActive": true,
;; "balance": "$1,782.51",
;; "picture": "http://placehold.it/32x32",
;; "age": 30,
;; "eyeColor": "blue",
;; "name": "Karen Hernandez",
;; "gender": "female",
;; "company": "CONCILITY",
;; "email": "karenhernandez@concility.com",
;; "phone": "+1 (853) 530-3600",
;; "address": "478 Schenck Street, Roland, Federated States Of Micronesia, 8478",
;; "about": "Esse id do irure ipsum quis occaecat cillum pariatur est ipsum esse exercitation reprehenderit aliqua. Ea nostrud fugiat sunt sunt. Ut aute voluptate consequat occaecat cupidatat magna irure. Occaecat sunt fugiat laboris est labore laborum dolor reprehenderit irure ipsum officia voluptate id nisi. Duis consequat minim nostrud magna nostrud consequat eiusmod nulla qui sunt incididunt cupidatat. Lorem ullamco aliqua officia adipisicing eiusmod labore incididunt irure aute nulla aliquip laborum cillum.\r\n",
;; "registered": "2016-03-14T11:34:25 +07:00",
;; "latitude": -5.325438,
;; "longitude": 18.0786,
;; "tags": [
;; "exercitation",
;; "sit",
;; "ad",
;; "sit",
;; "fugiat",
;; "enim",
;; "non"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Marilyn Mooney"
;; },
;; {
;; "id": 1,
;; "name": "Cindy Nunez"
;; },
;; {
;; "id": 2,
;; "name": "Ramirez Gilmore"
;; }
;; ],
;; "greeting": "Hello, Karen Hernandez! You have 4 unread messages.",
;; "favoriteFruit": "strawberry"
;; },
;; {
;; "_id": "5c77256bef0f2c88b63e1c2a",
;; "index": 2,
;; "guid": "7f91e154-37c3-40ca-b240-71854027eb7f",
;; "isActive": true,
;; "balance": "$2,210.88",
;; "picture": "http://placehold.it/32x32",
;; "age": 26,
;; "eyeColor": "brown",
;; "name": "Short Page",
;; "gender": "male",
;; "company": "PLEXIA",
;; "email": "shortpage@plexia.com",
;; "phone": "+1 (834) 421-2685",
;; "address": "129 Taaffe Place, Belmont, New Mexico, 7156",
;; "about": "Ipsum minim eiusmod cupidatat irure. Adipisicing voluptate ex mollit reprehenderit. Occaecat aliqua proident enim cillum adipisicing. Do adipisicing incididunt sit non cillum. Aute duis dolor incididunt nulla sit duis cillum non id.\r\n",
;; "registered": "2019-01-20T12:58:27 +08:00",
;; "latitude": -10.195242,
;; "longitude": 7.95824,
;; "tags": [
;; "occaecat",
;; "proident",
;; "pariatur",
;; "officia",
;; "eiusmod",
;; "velit",
;; "laboris"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Naomi Jennings"
;; },
;; {
;; "id": 1,
;; "name": "Blankenship Pruitt"
;; },
;; {
;; "id": 2,
;; "name": "Collins Carney"
;; }
;; ],
;; "greeting": "Hello, Short Page! You have 3 unread messages.",
;; "favoriteFruit": "strawberry"
;; },
;; {
;; "_id": "5c77256b4b4fbbd1e17ea23e",
;; "index": 3,
;; "guid": "39955cf0-3a93-4fa8-a85f-882bdcfc43c7",
;; "isActive": true,
;; "balance": "$3,613.59",
;; "picture": "http://placehold.it/32x32",
;; "age": 30,
;; "eyeColor": "green",
;; "name": "Katelyn Bruce",
;; "gender": "female",
;; "company": "ZOINAGE",
;; "email": "katelynbruce@zoinage.com",
;; "phone": "+1 (962) 514-3834",
;; "address": "201 Irwin Street, Succasunna, Texas, 1045",
;; "about": "Commodo elit laborum amet mollit. Non aute irure esse esse est anim ea mollit qui commodo. Do dolor occaecat Lorem incididunt qui anim commodo sunt. Occaecat cupidatat occaecat eiusmod dolore officia excepteur culpa laborum id eiusmod velit. Voluptate non cillum id nulla deserunt consectetur esse sunt quis. Eiusmod et anim occaecat sunt aute do aliqua id reprehenderit voluptate occaecat duis aliqua. Veniam nostrud velit laboris excepteur occaecat est elit.\r\n",
;; "registered": "2014-08-27T03:12:23 +07:00",
;; "latitude": 61.029178,
;; "longitude": 51.670902,
;; "tags": [
;; "consectetur",
;; "deserunt",
;; "irure",
;; "occaecat",
;; "voluptate",
;; "sint",
;; "esse"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Daniel Lopez"
;; },
;; {
;; "id": 1,
;; "name": "Marks Herman"
;; },
;; {
;; "id": 2,
;; "name": "Salas Meyers"
;; }
;; ],
;; "greeting": "Hello, Katelyn Bruce! You have 6 unread messages.",
;; "favoriteFruit": "banana"
;; },
;; {
;; "_id": "5c77256b46d29e2d9705b2d7",
;; "index": 4,
;; "guid": "d71fd89c-7191-4186-b653-ccffddbf1d04",
;; "isActive": true,
;; "balance": "$3,055.55",
;; "picture": "http://placehold.it/32x32",
;; "age": 25,
;; "eyeColor": "blue",
;; "name": "Hodges Espinoza",
;; "gender": "male",
;; "company": "MEMORA",
;; "email": "hodgesespinoza@memora.com",
;; "phone": "+1 (973) 425-2889",
;; "address": "199 Florence Avenue, Alamo, Vermont, 1187",
;; "about": "Lorem culpa sunt esse est ut et ea ea cillum enim commodo. Quis laborum officia deserunt amet magna culpa irure. Pariatur aliquip sint commodo esse in pariatur sint ullamco adipisicing reprehenderit id ea. Occaecat officia veniam nostrud sit ex velit incididunt. Tempor do aliquip cillum irure adipisicing. Ut ut sit voluptate voluptate adipisicing labore.\r\n",
;; "registered": "2014-01-22T04:07:00 +08:00",
;; "latitude": -10.760669,
;; "longitude": 10.497581,
;; "tags": [
;; "laboris",
;; "ut",
;; "qui",
;; "magna",
;; "minim",
;; "dolore",
;; "ullamco"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Pacheco Matthews"
;; },
;; {
;; "id": 1,
;; "name": "Lori Battle"
;; },
;; {
;; "id": 2,
;; "name": "Anthony Cote"
;; }
;; ],
;; "greeting": "Hello, Hodges Espinoza! You have 5 unread messages.",
;; "favoriteFruit": "banana"
;; },
;; {
;; "_id": "5c77256b9fe07cb9744a80c3",
;; "index": 5,
;; "guid": "38d6f176-ef52-4aa1-9747-613a43212bc9",
;; "isActive": true,
;; "balance": "$3,356.10",
;; "picture": "http://placehold.it/32x32",
;; "age": 36,
;; "eyeColor": "blue",
;; "name": "Booth Beard",
;; "gender": "male",
;; "company": "PHARMEX",
;; "email": "boothbeard@pharmex.com",
;; "phone": "+1 (947) 526-2640",
;; "address": "294 Marconi Place, Kanauga, Idaho, 8886",
;; "about": "Elit ad aliquip ad nostrud eu culpa elit voluptate consectetur qui excepteur. Fugiat aute voluptate minim exercitation sit. Dolore deserunt pariatur sit nulla. Duis velit cillum ipsum anim velit adipisicing nulla nulla sit magna amet. Aliqua nisi quis sit consectetur aliquip dolor nisi excepteur deserunt occaecat reprehenderit quis nulla. Eiusmod fugiat culpa ullamco tempor cillum commodo. Veniam quis velit aliqua do ea velit enim velit ea irure aliquip ex laboris.\r\n",
;; "registered": "2017-05-28T05:18:10 +07:00",
;; "latitude": -62.281245,
;; "longitude": 169.880199,
;; "tags": [
;; "deserunt",
;; "amet",
;; "eu",
;; "pariatur",
;; "consequat",
;; "non",
;; "exercitation"
;; ],
;; "friends": [
;; {
;; "id": 0,
;; "name": "Lorna Barker"
;; },
;; {
;; "id": 1,
;; "name": "Alyssa Carroll"
;; },
;; {
;; "id": 2,
;; "name": "Marcy Jacobs"
;; }
;; ],
;; "greeting": "Hello, Booth Beard! You have 6 unread messages.",
;; "favoriteFruit": "strawberry"
;; }
;; ];

;; t.deepEqual( parseExpression( encode( largeDataPayload ) ), largeDataPayload );

;; t.end();
;; } );
