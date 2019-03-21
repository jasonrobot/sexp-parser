<?php
declare(strict_types=1);

namespace Parser
{

    final class ParserResult
    {
        function __construct($data, int $next)
        {
            $this->data = $data;
            $this->next = $next;
        }

        function none(int $next)
        {
            return new self(null, $next);
        }
    }

    /**
     * Check if $char is the end of a symbol being evaluated
     */
    function isEndOfSymbol(string $expression, int $position) : bool
    {

        if ($position >= strlen($expression))
        {
            return true;
        }

        $char = $expression[$position];
        return (
            $char == ' ' ||
            $char == ')'
        );
    }

    function findEndOfSymbol(string &$expression, int $position) : int
    {
        while ( !isEndOfSymbol($expression, $position) )
        {
            $position += 1;
        }
        return $position;
    }

    function chompWhitespace(string &$expression, int $position) : int
    {
        while( $expression[$position] == ' ' )
        {
            $position += 1;
        }
        return $position;
    }

    function tryParseBool(string &$expression, int $position) : ParserResult
    {
        $endpos = $position + 3;
        if ( strtoupper($expression[$position]) === 'T' &&
             isEndOfSymbol($expression, $position + 1) )
        {
            return new ParserResult(true, $position + 1);
        }
        if ( (strlen($expression) >= $position + 3) &&
             (strtoupper(substr($expression, $position, 3)) === 'NIL') &&
             (isEndOfSymbol($expression, $position + 3) ) )
        {
            return new ParserResult(false, $position + 3);
        }
        return ParserResult::none($position);
    }

    function tryParseString(string &$expression, int $position) : ParserResult
    {
        if( $expression[$position] != '"' )
        {
            return ParserResult::none($position);
        }
        $startPosition = $position + 1;
        //skip the first quote
        $position += 1;

        $position = strpos($expression, '"', $position);

        $length = $position - $startPosition;
        return new ParserResult(
            substr($expression, $startPosition, $length),
            //skip the last quote
            $position + 1
        );
    }

    function tryParseSymbol(string &$expression, int $position) : ParserResult
    {
        if ( $expression[$position] != ':' )
        {
            return ParserResult::none($position);
        }

        $startPosition = $position;

        $position = findEndOfSymbol( $expression, $position );

        $length = $position - $startPosition;
        return new ParserResult(
            substr( $expression, $startPosition, $length ),
            $position
        );
    }

    function tryParseNumber(string &$expression, int $position) : ParserResult
    {
        $startPosition = $position;
        $position = findEndOfSymbol($expression, $position);
        $length = $position - $startPosition;
        $numberString = substr($expression, $startPosition, $length);
        if( !is_numeric($numberString) )
        {
            return ParserResult::none($position);
        }
        return new ParserResult( floatval($numberString), $position );
    }

    function tryAllParsers(&$expression, $position)
    {
        $maybeNumber = tryParseNumber($expression, $position);
        if ($maybeNumber->data !== null) { return $maybeNumber; }

        $maybeBool = tryParseBool($expression, $position);
        if ($maybeBool->data !== null) { return $maybeBool; }

        $maybeSymbol = tryParseSymbol($expression, $position);
        if ($maybeSymbol->data !== null) { return $maybeSymbol; }

        $maybeString = tryParseString($expression, $position);
        if ($maybeString->data !== null) { return $maybeString; }

        $maybeSexp = tryParseSexp($expression, $position);
        if ($maybeSexp->data !== null) { return $maybeSexp; }

        // if nothing can be parsed, just assume the whole thing is fucked
        return null;
    }

    function tryParseSexp(string &$expression, int $position) : ParserResult
    {
        if($expression[$position] != '(')
        {
            return ParserResult::none($position);
        }

        $position = $position + 1;
        $position = chompWhitespace($expression, $position);

        $resultData = [];
        while ( $expression[$position] != ')')
        {
            $parsedToken = tryAllParsers($expression, $position);
            if($parsedToken === null) { break; }

            $resultData[] = $parsedToken->data;
            $position = $parsedToken->next;
            $position = chompWhitespace($expression, $position);
        }
        //move over closing paren
        $position += 1;
        return new ParserResult($resultData, $position);
    }

    function isParensBalanced(string &$expression) : bool
    {
        $netBalance = 0;
        foreach (str_split($expression) as $char)
        {
            if ($char === '(')
            {
                $netBalance += 1;
            }
            if ($char === ')')
            {
                $netBalance -= 1;
            }
            if ($netBalance < 0)
            {
                return false;
            }
        }

        return $netBalance === 0;
    }

    function isQuotesBalanced(string &$expression) : bool
    {
        // $charCounts = count_chars($expression);
        // return $charCounts['"'] % 2 === 0;

        return substr_count($expression, '"') % 2 === 0;

    }

    function encodeAtom(&$data) : string
    {
        $dataType = gettype($data);

        switch ($dataType)
        {
        case 'string':
            return "\"$data\"";
            break;

        case 'boolean':
            if ( $data === true )
            {
                return "T";
            }
            else
            {
                return "NIL";
            }
            break;
        default:
            return (string)$data;
        }
    }


    function encodeArray(&$data) : string
    {
        $contents = '';

        foreach($data as $element)
        {
            $encodedElement = encode($element);
            $contents = "$contents $encodedElement";
        }
        $contents = trim($contents);
        return "($contents)";
    }


    // https://stackoverflow.com/questions/173400/how-to-check-if-php-array-is-associative-or-sequential
    function is_assoc(array $arr)
    {
        if (array() === $arr) return false;
        return array_keys($arr) !== range(0, count($arr) - 1);
    }

    // test encoding all data
    function encode(&$data) : string
    {
        if (is_array($data))
        {
            if (is_assoc($data))
            {
                $contents = "";
                foreach($data as $key => $value)
                {
                    $encodedValue = encode($value);
                    $contents = "$contents :$key $encodedValue";
                }
                $contents = trim($contents);
                return "($contents)";
            }
            else
            {
                return encodeArray($data);
            }
        }
        else
        {
            return encodeAtom($data);
        }
    }

}
