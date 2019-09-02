(ns sexp-parser.core
  (:require [clojure.string :as str]
            [clojure.edn :as edn]))

(defn tokenize [expression-string]
  (edn/read-string expression-string))

(defn map-or-self [item]
  (try
    (let [as-map (apply hash-map item)]
      (if (and (every? #(= clojure.lang.Keyword (type %1)) (keys as-map))
               (< 0 (count as-map)))
        as-map
        item))
    (catch Exception e item)))

(defn make-maps [item]
  "Map over elements of the array, turn them in to hash maps if possible."
  (if (coll? item)
    (map-or-self (map map-or-self item))
    item))

(defn parse [data]
  (make-maps (tokenize data)))

(defn encode-atom [data]
  (cond
    (= false data)
    "NIL"
    (= true data)
    "T"
    :else
    (pr-str data)))

(declare encode)
(defn encode-array [data]
  (str "("
       (str/join " " (map encode data))
       ")"))

(defn encode-map [data]
  (-> (pr-str data)
      (str/replace #"\{" "(")
      (str/replace #"\}" ")")))

(defn encode [data]
  (str/replace
   (cond
     (or (vector? data) (list? data))
     (encode-array data)
     (map? data)
     (encode-map data)
     :else
     (encode-atom data))
   #","
   ""))
