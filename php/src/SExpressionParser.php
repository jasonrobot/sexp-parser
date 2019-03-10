<?php
declare(strict_types=1);

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

final class Parser
{

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
        while ( !self::isEndOfSymbol($expression, $position) )
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
        if ( strtoupper($expression[$position]) == 'T' &&
             self::isEndOfSymbol($expression, $position + 1) )
        {
            return new ParserResult(true, $position + 1);
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

        $position = self::findEndOfSymbol( $expression, $position );

        $length = $position - $startPosition;
        return new ParserResult(
            substr( $expression, $startPosition, $length ),
            $position
        );
    }

    function tryParseNumber(string &$expression, int $position) : ParserResult
    {
        $startPosition = $position;
        $position = self::findEndOfSymbol($expression, $position);
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
        $maybeNumber = self::tryParseNumber($expression, $position);
        if ($maybeNumber->data != null) { return $maybeNumber; }

        $maybeBool = self::tryParseBool($expression, $position);
        if ($maybeBool->data != null) { return $maybeBool; }

        $maybeSymbol = self::tryParseSymbol($expression, $position);
        if ($maybeSymbol->data != null) { return $maybeSymbol; }

        $maybeString = self::tryParseString($expression, $position);
        if ($maybeString->data != null) { return $maybeString; }

        $maybeSexp = self::tryParseSexp($expression, $position);
        if ($maybeSexp->data != null) { return $maybeSexp; }

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
        $position = self::chompWhitespace($expression, $position);

        $resultData = [];
        while ( $expression[$position] != ')')
        {
            $parsedToken = self::tryAllParsers($expression, $position);
            if($parsedToken == null) { break; }

            $resultData[] = $parsedToken->data;
            $position = $parsedToken->next;
            $position = self::chompWhitespace($expression, $position);
        }
        //move over closing paren
        $position += 1;
        return new ParserResult($resultData, $position);
    }

}
