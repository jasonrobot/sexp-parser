(ns sexp-parser.core
  (:require [clojure.string :as str]))

(defn parse-result [data next]
  {:data data :next next})

(defn end-of-symbol? [expression position]
  (let [point (get expression position)]
    (or (= point nil)
        (= point \space)
        (= point \)))))

(defn find-end-of-symbol [expression position]
  (let [next-space (str/index-of expression \space position)
        next-paren (str/index-of expression \) position)]
    (if (and (nil? next-space) (nil? next-paren))
      (count expression)
      (cond
        (nil? next-space) next-paren
        (nil? next-paren) next-space
        :else
        (if (< next-space next-paren)
          next-space
          next-paren)))))

(defn parse-bool? [expression]
  (cond
    (= expression "T")
    true
    (= expression "NIL")
    false
    :else
    nil))

(defn parse-string? [expression]
  (if (not (= (get expression 0) \"))
    nil
    (-> (str/replace expression #"\"" ""))))

;; FIXME its keyword here, not symbol
(defn parse-symbol? [expression]
  (if (not (= (get expression 0) \:))
    nil
    (keyword (subs expression 1))))

(defn parse-double [s]
  (try
    (Double/parseDouble (re-find #"-?[\d\.]+" s))
    (catch Exception e nil)))

(defn parse-number? [expression]
  (let [value (parse-double expression)]
    (if (not (number? value))
      nil
      value)))

;; Obviously there are no JS objects in clojure, so its a Map.
(defn parse-object? [expression])

;; get the position of the next non-whitespace char
;; FIXME dont use an atom, dingus
(defn chomp-whitespace [expression start-position]
  (def position (atom start-position))
  (while (let [current-char (get expression @position)]
           (or (= current-char \space)
               (= current-char \newline)))
    (swap! position inc))
  @position)

(defn parse-token [token]
  (or (parse-number? token)
      (parse-bool? token)
      (parse-symbol? token)
      (parse-string? token)))

;;; FIXME this doesn't work for strings!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
(defn tokenize [expression-string]
  ;; (remove #(= "" %1)
  ;;       (-> expression-string
  ;;           (str/replace  #"([\(\)])" " $1 ")
  ;;           (str/split #" "))))
  ;; Good coders reimplement. Great coders steal. Galaxy brain coders use libraries.
  (-> expression-string
      (edn/read-string)


(def tok2 [expr]
  (loop [toks []
         rst expr]
    (let [cur (first rst)]
      (cond
        (= "\"" cur)
        ;; From here till next non-escaped quote is a token.
        (do
          (let [next-quot (


(defn rejoin-strings [tokens]
  )

;;; Very yikes.
;; parse-sexp :: Vec -> Seq(string) -> Vec(Vec(Tokens) Seq(string))
(defn parse-reduce-sexp [init-acc sexp]
  (loop [acc init-acc
         tokens sexp]
    (let [cur-token (first tokens)]
      (cond
        (= cur-token "(")
        ;; (apply recur (into acc (parse-sexp (rest tokens))))
        (let [[next-acc next-tokens] (parse-reduce-sexp [] (rest tokens))]
          (recur next-acc next-tokens))
        (or (= ")" cur-token)
            (= nil cur-token)
            (empty? tokens))
        [acc (rest tokens)]
        :else
        (recur (into acc [(parse-token cur-token)]) (rest tokens))))))

(defn parse-sexp? [expression]
  (first (parse-reduce-sexp [] (tokenize expression))))

(defn balance-reducer [acc next]
  (if (= acc false)
    false
    (cond
      (= next \()
      (inc acc)
      (= next \))
      (do
        ;; (dec acc) ;Decrement acc, then check if we have too many closes.
        (if (> 0 (dec acc))
          false
          (dec acc)))
      :else ;it's a non-paren, return acc so we keep going
      acc)))

(defn parens-balanced? [expression]
  (= 0 (reduce balance-reducer 0 expression)))

(defn quotes-balanced? [expression]
  (let [quote-count (count (re-seq #"\"" expression))]
    (or (== 0 quote-count)
        (= 0 (mod 2 quote-count)))))

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
  (cond
    (or (vector? data) (list? data))
    (encode-array data)
    (map? data)
    (encode-map data)
    :else
    (encode-atom data)))
