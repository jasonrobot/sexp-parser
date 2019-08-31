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

(defn parse-bool? [expression position]
  (cond
    (and (= (get expression position) \T)
         (end-of-symbol? expression (inc position)))
    (parse-result true (inc position))
    (= (subs expression position (+ 3 position)) "NIL")
    (parse-result false (+ 3 position))
    :else
    (parse-result nil position)))

(defn parse-string? [expression position]
  (if (not (= (get expression position) \"))
    (parse-result nil position)
    (let [start-position (inc position)
          end-position (str/index-of expression \" (inc position))]
      (parse-result (subs expression start-position end-position)
                    (inc end-position)))))

;; FIXME its keyword here, not symbol
(defn parse-symbol? [expression position]
  (if (not (= (get expression position) \:))
    (parse-result nil position)
    (let [end-position (find-end-of-symbol expression position)]
      (parse-result (keyword (subs expression (inc position) end-position))
                    end-position))))

(defn -parse-double [s]
  (Double/parseDouble (re-find #"-?[\d\.]+" s)))

(defn parse-number? [expression position]
  (let [end-position (find-end-of-symbol expression position)
        value (-parse-double (subs expression position end-position))]
    (if (not (number? value))
      (parse-result nil position)
      (parse-result value end-position))))

;; Obviously there are no JS objects in clojure, so its a Map.
(defn parse-object? [expression position])

;; get the position of the next non-whitespace char
(defn chomp-whitespace [expression start-position]
  (def position (atom start-position))
  (while (let [current-char (get expression @position)]
           (or (= current-char \space)
               (= current-char \newline)))
    (swap! position inc))
  @position)

(defn parse-sexp? [expression position]
  (if (not (= (get expression position) \())
    (parse-result nil position)
    (let [start-position (chomp-whitespace (inc position))
          current-position (atom start-position)]
      (while (not (= (get expression @current-position) \)))
        (let [parsed-token (or (parse-number? expression @current-position)
                               (parse-bool? expression @current-position)
                               (parse-symbol? expression @current-position)
                               (parse-string? expression @current-position)
                               (parse-sexp? expression @current-position))]
          ;; (swap! current-position (:next parsed-token))
          ;; (append result (:data parsed-token)))))))
          )))))

(defn parens-balanced? [expression]
  (reduce (fn [acc next]
            (cond
              (= next \()
              (inc acc)
              (= next \))
              (dec acc)))
          0
          expression))

(defn quotes-balanced? [expression]
  (= 0 (mod 2 (count (re-seq #"\"" expression)))))

(defn encode-atom [data]
  (cond
    (= false data)
    "NIL"
    (= true data)
    "T"
    :else
    (pr-str data)))

(defn encode-array [data])

(defn encode [data])
