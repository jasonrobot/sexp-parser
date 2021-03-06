# TODO: Write documentation for `SExpressionParser`
module SExpressionParser
  VERSION = "0.1.0"

  # class ParserResult
  #   getter success : Bool,
  #          data : Result,
  #          next : Int32
  #   def initialize( @data, @next )
  #      @success = ( @data.nil? == false )
  #   end
  # end

  alias Result = Float64 | String | Bool | Array(Result) | Hash(String, Result) | Nil
  # alias Result = Float64 | String | Bool | Nil
  alias Number = Float64

  struct ParseResult
    property data : Result,
             nextPosition : Int32

    def initialize(@data, @nextPosition)
    end

    def succes? : Bool
      @data.nil? == false
    end
  end

  class Parser
    property expression : String,
             position : Int32,
             result : Result

    def initialize(@expression)
      @result = [] of Result
      @position = 0
    end

    def endOfSymbol
      @expression.index(/[\s)]/, @position) || @expression.size
    end

    def chompWhitespace!
      until @expression[@position]?.nil? || @expression[@position] != ' '
        @position += 1
      end
    end

    def parseBool
      if expression[position...position + 1].compare("T", true) == 0
        @result << true
        @position += 1
      elsif expression[position...position + 3].compare("NIL", true) == 0
        @result << false
        @position += 3
      end
    end

    def parseSymbol
      # return ParseResult.new(nil, position) unless expression[position] == ':'

      startPosition = @position
      endPosition = endOfSymbol

      @result << expression[startPosition...@position]
      @position = endPosition
    end

    def parseString
      startPosition = @position
      endPosition = @expression.index('"', @position + 1) || @position
      unless endPosition.nil? || @expression[endPosition] != '"'
        @result << @expression[startPosition..@position]
        @position = endPosition
      end
    end

    def parseNumber
      startPosition = @position
      endPosition = endOfSymbol

      numberResult = @expression[startPosition...endPosition].to_f64?

      unless numberResult.nil?
        @result << numberResult
        @position = endPosition
      end
    end

    def parseSexp(expression, position)
      # this is dumb because we're gonna have to create a NEW PARSER INSTANCE to do our
      # recursive descent if we wanna be OOP. Honestly, what's the benefit even.
      return unless expression[position] == '('
      @position += 1

      chompWhitespace!

      resultData = [] of Result

      until @expression[@position].nil? || @expression[@position] == ')'
        parseBool
        parseString
        parseSexp
        parseSymbol
        parseNumber

        if parsedToken.data.nil?
          break
        end

        resultData << parsedToken.data
        position = parsedToken.nextPosition

        while expression[position] == ' '
          position += 1
        end
      end
      position += 1

      ParseResult.new(resultData, position)
    end

  end

  def endOfSymbol(expression, position = 0) : Int32
    expression.index(/[\s)]/, position) || expression.size
  end

  def chompWhitespace(expression, position)
    until expression[position]?.nil? || expression[position] != ' '
      position += 1
    end
    position
  end

  def parseBool(expression, position) : ParseResult
    if expression[position...position + 1].compare("T", true) == 0
      ParseResult.new(true, position + 1)
    elsif expression[position...position + 3].compare("NIL", true) == 0
      ParseResult.new(false, position + 3)
    else
      ParseResult.new(nil, position)
    end
  end

  def parseSymbol(expression, position : Int32) : ParseResult
    return ParseResult.new(nil, position) unless expression[position] == ':'

    startPosition = position
    position = endOfSymbol(expression, position)

    ParseResult.new(expression[startPosition...position], position)
  end

  def parseString(expression, position) : ParseResult
    startPosition = position
    position = expression.index('"', position + 1)
    if position.nil? || expression[position] != '"'
      return ParseResult.new(nil, startPosition)
    end

    position |= 0

    ParseResult.new(expression[startPosition..position], position + 1)
  end

  def parseNumber(expression, position : Int32) : ParseResult
    startPosition = position
    position = endOfSymbol(expression, position)

    numberResult = expression[startPosition...position].to_f64?

    if numberResult.nil?
      ParseResult.new(nil, startPosition)
    else
      ParseResult.new(numberResult, position)
    end
  end

  # Try all token parsers and bail early of one works.
  def tryParsers(expression, position) : ParseResult
    parsedToken = ParseResult.new(nil, position)

    parsedToken = parseSexp(expression, position)
    return parsedToken unless parsedToken.data.nil?

    parsedToken = parseString(expression, position)
    return parsedToken unless parsedToken.data.nil?

    parsedToken = parseSymbol(expression, position)
    return parsedToken unless parsedToken.data.nil?

    parsedToken = parseBool(expression, position)
    return parsedToken unless parsedToken.data.nil?

    parsedToken = parseNumber(expression, position)
    # return parsedToken unless parsedToken.data.nil?

    return parsedToken
  end

  def parseSexp(expression, position)
    unless expression[position] == '('
      return ParseResult.new(nil, position)
    end

    position = chompWhitespace(expression, position + 1)

    resultData = [] of Result

    until expression[position].nil? || expression[position] == ')'
      parsedToken = tryParsers(expression, position)

      if parsedToken.data.nil?
        break
      end

      resultData << parsedToken.data
      position = parsedToken.nextPosition

      while expression[position] == ' '
        position += 1
      end
    end
    position += 1

    ParseResult.new(resultData, position)
  end
end
