<?php
declare(strict_types=1);

final class ParserResult
{
    function __construct(string $data, int $next)
    {
        $this->data = $data;
        $this->next = $next;
        $this->success = true;
    }

    function none(int $next)
    {
        $temp = new self('', $next);
        $temp->success = false;
        return $temp;
    }
}

final class Parser
{

    /**
     * Check if $char is the end of a symbol being evaluated
     */
    function isEndOfSymbol(string $char, int $position) : bool
    {
        if ($position >= strlen($char))
        {
            return true;
        }

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
        return ParserResult::none($position);
    }

    function tryParseSymbol(string &$expression, int $position) : ParserResult
    {
        return ParserResult::none($position);
    }

    function tryParseNumber(string &$expression, int $position) : ParserResult
    {
        return ParserResult::none($position);
    }

}
