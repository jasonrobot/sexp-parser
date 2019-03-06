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
             position : Int32

    def initialize(@data, @position)
    end

    def succes? : Bool
      @data.nil? == false
    end
  end

  def endOfSymbol?(char : Char | Nil)
    char.nil? || char == ' ' || char == ')'
  end

  def endOfSymbol(expression, position = 0)
    expression.index /[\s)]/, position
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

  def parseSymbol(expression, position) : ParseResult
    return ParseResult.new(nil, position) unless expression[position] == ':'

    startPosition = position
    position = endOfSymbol(expression, position)

    ParseResult.new(expression[startPosition...position], position)
  end

  def parseString(expression, position) : ParseResult
    startPosition = position
    position = expression.index('"', position)
    hasQuotes? = expression[position] == '"' && !position.nil?
    return ParseResult.new(nil, startPosition) unless hasQuotes?

    ParseResult.new(expression[startPosition..position], position + 1)
  end

  def parseNumber(expression, position) : Result
    startPosition = position
    position = endOfSymbol(expression, position)

    numberResult = expression[startPosition...position].to_f64?

    if numberResult.nil?
      ParseResult.new(nil, startPosition)
    else
      ParseResult.new(numberResult, position)
    end
  end

  def parseSexp(expression) : Tuple(Array(Result), Int32)
    # return {nil, 0} unless expression.starts_with? "("

    result = [] of Result

    # expression = expression[1...expression.size]
    position = 1
    position = chompWhitespace expression, position

    # if we have a close paren, we're done
    until expression[position]?.nil? || expression[position] == ')'
      position = chompWhitespace expression, position
      puts "looping now at #{position}: #{expression}, which is #{expression[position]?}"

      # if we have an open paren, call ourselves recursively
      if expression[position] == '('
        puts "recursive call"
        sexpResult = parseSexp(expression[position..-1])
        result << sexpResult[0]
        position = sexpResult[1]
      else
        # find the end of the current item, and grab it
        endOfCurrentSymbol = endOfSymbol(expression, position) || expression.size - 1
        item = expression[position...endOfCurrentSymbol]
        position = endOfCurrentSymbol
        puts "end is at #{endOfCurrentSymbol}"

        # bool = parseBool item
        # return bool unless bool.nil?
        # num = parseNumber item
        # return num unless num.nil?
        # sym = parseSymbol item
        # return sym unless sym.nil?
        # str = parseString item
        # return str unless str.nil?

        # puts "making attempts"

        # this should be fine, because nothing should parse as more than 1 type
        attempts = [] of Result
        attempts << parseBool item
        attempts << parseNumber item
        attempts << parseSymbol item
        attempts << parseString item

        result = result + attempts.compact

        # puts attempts
        # result = result << attem
        # position += 1
      end
    end
    {result, position + 1}
  end

  # OOP is retarded

  # class Parser
  #   alias ParseResult = Int32 | String | Bool | Array(ParseResult) | Hash(String, ParseResult) | Nil

  #   getter position : Int32,
  #          expression : String,
  #          lastResult : ParseResult

  #   def initialize( @expression = "", @position = 0 )
  #   end

  #   def endOfSymbol?
  #     char = @expression[@position]?

  #     ( char.nil? || char == ' ' || char == ')' )
  #   end

  #   # findNext -> String#index (search : Char)

  #   def chompWhitespace( expression, position )
  #     while @expression[@position]?.nil? == false && @expression[@position] == ' '
  #       @position += 1
  #     end
  #   end

  #   def parseBool?

  #   end

  # end
end

include SExpressionParser
parseSexp("(1 (2 3))")
