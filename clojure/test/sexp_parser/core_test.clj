(ns sexp-parser.core-test
  (:require [clojure.test :refer :all]
            [sexp-parser.core :refer :all]))

(deftest parse-test
  (is (= (parse "(1 2 3)") '(1 2 3)))
  (is (= (parse "()") '()))
  (is (= (parse "(1 (2 3) 4)") '(1 (2 3) 4)))
  (is (= (parse "(())") '(())))
  (is (= (parse "( ( ) )") '(())))
  (is (= (parse "(() () ())") '(() () ())))
  (is (= (parse "( ( 2 ) 3)") '((2) 3)))

  (testing "key value objects"
    (is (= (parse "(:a 1)") {:a 1}))
    (is (= (parse "(:foo 123 :bar \"asd\")") {:foo 123 :bar "asd"}))
    (is (= (parse "(:a (:b (:c 69)))") {:a {:b {:c 69}}}))))

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
  (is (= (encode {:number 123
                  :digits ["1" "2" "3"]
                  :attributes {:even false
                               :positive true}})
         "(:number 123 :digits (\"1\" \"2\" \"3\") :attributes (:even NIL :positive T))")))

(deftest large-round-trip-test
  (let [large-payload
        [{:tags
          ["fugiat"
           "eu"
           "Lorem"
           "laborum"
           "fugiat"
           "pariatur"
           "ex"],
          :_id "5c77256b120e71539a4543a7",
          :address
          "219 Chase Court, Hebron, New Jersey, 6091",
          :email "doraweiss@circum.com",
          :age 40,
          :favoriteFruit "banana",
          :index 0,
          :phone "+1 (957) 431-3727",
          :name "Dora Weiss",
          :longitude 4.637068,
          :isActive true,
          :balance "$1,556.23",
          :friends
          [{:id 0, :name "Lynette Mccarthy"}
           {:id 1, :name "Leila Medina"}
           {:id 2, :name "Kasey Moss"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "brown",
          :latitude -82.633003,
          :gender "female",
          :registered "2014-08-01T12:47:41 +07:00",
          :greeting
          "Hello, Dora Weiss! You have 9 unread messages.",
          :company "CIRCUM",
          :about
          "Quis ipsum eu deserunt ut mollit est eu duis commodo reprehenderit cupidatat nulla ad aliquip. Tempor nulla in consequat est voluptate veniam excepteur pariatur sunt sint. Veniam laborum aliqua esse elit qui est exercitation velit. Mollit qui exercitation nulla elit ex ad aute laborum reprehenderit. Quis ipsum proident velit do. Dolor dolore incididunt aliquip culpa cillum enim. Id incididunt ullamco aliquip id mollit elit ullamco qui duis ut mollit.\r\n",
          :guid "c9815eb2-fdc5-42f8-bbb3-c2dadaf4c1b8"}
         {:tags
          ["exercitation"
           "sit"
           "ad"
           "sit"
           "fugiat"
           "enim"
           "non"],
          :_id "5c77256ba6e9551c135fc72f",
          :address
          "478 Schenck Street, Roland, Federated States Of Micronesia, 8478",
          :email "karenhernandez@concility.com",
          :age 30,
          :favoriteFruit "strawberry",
          :index 1,
          :phone "+1 (853) 530-3600",
          :name "Karen Hernandez",
          :longitude 18.0786,
          :isActive true,
          :balance "$1,782.51",
          :friends
          [{:id 0, :name "Marilyn Mooney"}
           {:id 1, :name "Cindy Nunez"}
           {:id 2, :name "Ramirez Gilmore"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "blue",
          :latitude -5.325438,
          :gender "female",
          :registered "2016-03-14T11:34:25 +07:00",
          :greeting
          "Hello, Karen Hernandez! You have 4 unread messages.",
          :company "CONCILITY",
          :about
          "Esse id do irure ipsum quis occaecat cillum pariatur est ipsum esse exercitation reprehenderit aliqua. Ea nostrud fugiat sunt sunt. Ut aute voluptate consequat occaecat cupidatat magna irure. Occaecat sunt fugiat laboris est labore laborum dolor reprehenderit irure ipsum officia voluptate id nisi. Duis consequat minim nostrud magna nostrud consequat eiusmod nulla qui sunt incididunt cupidatat. Lorem ullamco aliqua officia adipisicing eiusmod labore incididunt irure aute nulla aliquip laborum cillum.\r\n",
          :guid "ec2b621f-e35a-4447-9ecb-c3bee2feeeea"}
         {:tags
          ["occaecat"
           "proident"
           "pariatur"
           "officia"
           "eiusmod"
           "velit"
           "laboris"],
          :_id "5c77256bef0f2c88b63e1c2a",
          :address
          "129 Taaffe Place, Belmont, New Mexico, 7156",
          :email "shortpage@plexia.com",
          :age 26,
          :favoriteFruit "strawberry",
          :index 2,
          :phone "+1 (834) 421-2685",
          :name "Short Page",
          :longitude 7.95824,
          :isActive true,
          :balance "$2,210.88",
          :friends
          [{:id 0, :name "Naomi Jennings"}
           {:id 1, :name "Blankenship Pruitt"}
           {:id 2, :name "Collins Carney"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "brown",
          :latitude -10.195242,
          :gender "male",
          :registered "2019-01-20T12:58:27 +08:00",
          :greeting
          "Hello, Short Page! You have 3 unread messages.",
          :company "PLEXIA",
          :about
          "Ipsum minim eiusmod cupidatat irure. Adipisicing voluptate ex mollit reprehenderit. Occaecat aliqua proident enim cillum adipisicing. Do adipisicing incididunt sit non cillum. Aute duis dolor incididunt nulla sit duis cillum non id.\r\n",
          :guid "7f91e154-37c3-40ca-b240-71854027eb7f"}
         {:tags
          ["consectetur"
           "deserunt"
           "irure"
           "occaecat"
           "voluptate"
           "sint"
           "esse"],
          :_id "5c77256b4b4fbbd1e17ea23e",
          :address
          "201 Irwin Street, Succasunna, Texas, 1045",
          :email "katelynbruce@zoinage.com",
          :age 30,
          :favoriteFruit "banana",
          :index 3,
          :phone "+1 (962) 514-3834",
          :name "Katelyn Bruce",
          :longitude 51.670902,
          :isActive true,
          :balance "$3,613.59",
          :friends
          [{:id 0, :name "Daniel Lopez"}
           {:id 1, :name "Marks Herman"}
           {:id 2, :name "Salas Meyers"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "green",
          :latitude 61.029178,
          :gender "female",
          :registered "2014-08-27T03:12:23 +07:00",
          :greeting
          "Hello, Katelyn Bruce! You have 6 unread messages.",
          :company "ZOINAGE",
          :about
          "Commodo elit laborum amet mollit. Non aute irure esse esse est anim ea mollit qui commodo. Do dolor occaecat Lorem incididunt qui anim commodo sunt. Occaecat cupidatat occaecat eiusmod dolore officia excepteur culpa laborum id eiusmod velit. Voluptate non cillum id nulla deserunt consectetur esse sunt quis. Eiusmod et anim occaecat sunt aute do aliqua id reprehenderit voluptate occaecat duis aliqua. Veniam nostrud velit laboris excepteur occaecat est elit.\r\n",
          :guid "39955cf0-3a93-4fa8-a85f-882bdcfc43c7"}
         {:tags
          ["laboris"
           "ut"
           "qui"
           "magna"
           "minim"
           "dolore"
           "ullamco"],
          :_id "5c77256b46d29e2d9705b2d7",
          :address
          "199 Florence Avenue, Alamo, Vermont, 1187",
          :email "hodgesespinoza@memora.com",
          :age 25,
          :favoriteFruit "banana",
          :index 4,
          :phone "+1 (973) 425-2889",
          :name "Hodges Espinoza",
          :longitude 10.497581,
          :isActive true,
          :balance "$3,055.55",
          :friends
          [{:id 0, :name "Pacheco Matthews"}
           {:id 1, :name "Lori Battle"}
           {:id 2, :name "Anthony Cote"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "blue",
          :latitude -10.760669,
          :gender "male",
          :registered "2014-01-22T04:07:00 +08:00",
          :greeting
          "Hello, Hodges Espinoza! You have 5 unread messages.",
          :company "MEMORA",
          :about
          "Lorem culpa sunt esse est ut et ea ea cillum enim commodo. Quis laborum officia deserunt amet magna culpa irure. Pariatur aliquip sint commodo esse in pariatur sint ullamco adipisicing reprehenderit id ea. Occaecat officia veniam nostrud sit ex velit incididunt. Tempor do aliquip cillum irure adipisicing. Ut ut sit voluptate voluptate adipisicing labore.\r\n",
          :guid "d71fd89c-7191-4186-b653-ccffddbf1d04"}
         {:tags
          ["deserunt"
           "amet"
           "eu"
           "pariatur"
           "consequat"
           "non"
           "exercitation"],
          :_id "5c77256b9fe07cb9744a80c3",
          :address
          "294 Marconi Place, Kanauga, Idaho, 8886",
          :email "boothbeard@pharmex.com",
          :age 36,
          :favoriteFruit "strawberry",
          :index 5,
          :phone "+1 (947) 526-2640",
          :name "Booth Beard",
          :longitude 169.880199,
          :isActive true,
          :balance "$3,356.10",
          :friends
          [{:id 0, :name "Lorna Barker"}
           {:id 1, :name "Alyssa Carroll"}
           {:id 2, :name "Marcy Jacobs"}],
          :picture "http://placehold.it/32x32",
          :eyeColor "blue",
          :latitude -62.281245,
          :gender "male",
          :registered "2017-05-28T05:18:10 +07:00",
          :greeting
          "Hello, Booth Beard! You have 6 unread messages.",
          :company "PHARMEX",
          :about
          "Elit ad aliquip ad nostrud eu culpa elit voluptate consectetur qui excepteur. Fugiat aute voluptate minim exercitation sit. Dolore deserunt pariatur sit nulla. Duis velit cillum ipsum anim velit adipisicing nulla nulla sit magna amet. Aliqua nisi quis sit consectetur aliquip dolor nisi excepteur deserunt occaecat reprehenderit quis nulla. Eiusmod fugiat culpa ullamco tempor cillum commodo. Veniam quis velit aliqua do ea velit enim velit ea irure aliquip ex laboris.\r\n",
          :guid "38d6f176-ef52-4aa1-9747-613a43212bc9"}]]
    (is (= (parse (encode large-payload))))))
