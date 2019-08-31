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
         (end-of-symbol? expression (+ 1 position)))
    (parse-result true (+ 1 position))
    (= (subs expression position (+ 3 position)) "NIL")
    (parse-result false (+ 3 position))
    :else
    (parse-result nil position)))

(defn parse-string? [expression position]
  (if (not (= (get expression position) \"))
    (parse-result nil position)
    (let [start-position (+ 1 position)
          end-position (str/index-of expression \" (+ 1 position))]
      (parse-result (subs expression start-position end-position)
                    (+ 1 end-position)))))

;; FIXME its keyword here, not symbol
(defn parse-symbol? [expression position]
  (if (not (= (get expression position) \:))
    (parse-result nil position)
    (let [end-position (find-end-of-symbol expression position)]
      (parse-result (keyword (subs expression (+ 1 position) end-position))
                    end-position))))

(defn -parse-double [s]
  (Double/parseDouble (re-find #"-?[\d\.]+" s)))

(defn parse-number? [expression position]
  (let [end-position (find-end-of-symbol expression position)
        value (-parse-double (subs expression position end-position))]
    (if (not (number? value))
      (parse-result nil position)
      (parse-result value end-position))))

(defn parse-sexp? [expression position])

(defn chomp-whitespace [expression position])

(defn parens-balanced? [expression])

(defn quotes-balanced? [expression])

(defn encode-atom [data])

(defn encode-array [data])

(defn encode [data])
