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

}
