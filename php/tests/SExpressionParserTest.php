<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class SexpParserTest extends TestCase
{
    function testIsEndOfSymbol() : void
    {
        $expr = ' ';
        $this->assertTrue( Parser::isEndOfSymbol($expr, 0) );

        $expr = ')';
        $this->assertTrue( Parser::isEndOfSymbol($expr, 0) );
    }

    function testFindEndOfSymbol() : void
    {
        $expr = 'asd)';
        $this->assertEquals(3,  Parser::findEndOfSymbol($expr, 0) );

        $expr = 'asd ';
        $this->assertEquals( 3,  Parser::findEndOfSymbol($expr, 0) );
    }

    function testChompWhitespace() : void
    {
        $expr = ' a';
        $this->assertEquals( 1,  Parser::chompWhitespace($expr, 0) );
    }

    function testParseBool() : void
    {
        $expr = 'nil';
        $this->assertEquals( false,  Parser::tryParseBool($expr, 0)->data);

        $expr = 'NIL';
        $this->assertEquals( false,  Parser::tryParseBool($expr, 0)->data);

        $expr = 't';
        $this->assertEquals( true,  Parser::tryParseBool($expr, 0)->data);

        $expr = 'T';
        $this->assertEquals( true,  Parser::tryParseBool($expr, 0)->data);
    }

    function testParseString() : void
    {
        $expr = '"asdf"';
        $this->assertEquals( 'asdf', Parser::tryParseString($expr, 0)->data);
        // $this->assertEquals( 'asdf', Parser::tryParseString('"asdf"', 0)->data);
        // $this->assertEquals( 'asdf', Parser::tryParseString('"asdf"', 0)->data);
        // $this->assertEquals( 'asdf', Parser::tryParseString('"asdf"', 0)->data);
    }

    function testParseSymbol() : void
    {
        $expr = ':foo';
        $this->assertEquals( ':foo', Parser::tryParseSymbol($expr, 0)->data);

        $expr = ':bar)';
        $this->assertEquals( ':bar', Parser::tryParseSymbol($expr, 0)->data);

        $expr = ':cAsEsEnSiTiVe';
        $this->assertEquals( ':cAsEsEnSiTiVe', Parser::tryParseSymbol($expr, 0)->data);

        $expr = 'asdf';
        $this->assertEquals( null, Parser::tryParseSymbol($expr, 0)->data);
    }

    function testParseNumber() : void
    {
        $expr = '12';
        $this->assertEquals( 12, Parser::tryParseNumber($expr, 0)->data);
        $expr = '-1';
        $this->assertEquals( 12, Parser::tryParseNumber($expr, 0)->data);
        $expr = '0.5';
        $this->assertEquals( 12, Parser::tryParseNumber($expr, 0)->data);
        $expr = '.5';
        $this->assertEquals( 12, Parser::tryParseNumber($expr, 0)->data);
        $expr = '-0.5';
        $this->assertEquals( 12, Parser::tryParseNumber($expr, 0)->data);
    }
}
