<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class SexpParserTest extends TestCase
{
    function testIsEndOfSymbol() : void
    {
        $expr = ' ';
        $this->assertTrue( Parser\isEndOfSymbol($expr, 0) );

        $expr = ')';
        $this->assertTrue( Parser\isEndOfSymbol($expr, 0) );
    }

    function testFindEndOfSymbol() : void
    {
        $expr = 'asd)';
        $this->assertEquals(3,  Parser\findEndOfSymbol($expr, 0) );

        $expr = 'asd ';
        $this->assertEquals( 3,  Parser\findEndOfSymbol($expr, 0) );
    }

    function testChompWhitespace() : void
    {
        $expr = ' a';
        $this->assertEquals( 1,  Parser\chompWhitespace($expr, 0) );
    }

    function testParseBool() : void
    {
        $expr = 'nil';
        $this->assertEquals( false,  Parser\tryParseBool($expr, 0)->data);
        $this->assertIsBool(Parser\tryParseBool($expr, 0)->data);

        $expr = 'NIL';
        $this->assertEquals( false,  Parser\tryParseBool($expr, 0)->data);
        $this->assertIsBool(Parser\tryParseBool($expr, 0)->data);

        $expr = 't';
        $this->assertEquals( true,  Parser\tryParseBool($expr, 0)->data);

        $expr = 'T';
        $this->assertEquals( true,  Parser\tryParseBool($expr, 0)->data);
    }

    function testParseString() : void
    {
        $expr = '"asdf"';
        $this->assertEquals( 'asdf', Parser\tryParseString($expr, 0)->data);
        $this->assertEquals( 6 , Parser\tryParseString($expr, 0)->next);
        // $this->assertEquals( 'asdf', Parser\tryParseString('"asdf"', 0)->data);
        // $this->assertEquals( 'asdf', Parser\tryParseString('"asdf"', 0)->data);
        // $this->assertEquals( 'asdf', Parser\tryParseString('"asdf"', 0)->data);
    }

    function testParseSymbol() : void
    {
        $expr = ':foo';
        $this->assertEquals( ':foo', Parser\tryParseSymbol($expr, 0)->data);

        $expr = ':bar)';
        $this->assertEquals( ':bar', Parser\tryParseSymbol($expr, 0)->data);

        $expr = ':cAsEsEnSiTiVe';
        $this->assertEquals( ':cAsEsEnSiTiVe', Parser\tryParseSymbol($expr, 0)->data);

        $expr = 'asdf';
        $this->assertEquals( null, Parser\tryParseSymbol($expr, 0)->data);
    }

    function testParseNumber() : void
    {
        $expr = '12';
        $this->assertEquals( 12, Parser\tryParseNumber($expr, 0)->data);
        $expr = '-1';
        $this->assertEquals( -1, Parser\tryParseNumber($expr, 0)->data);
        $expr = '0.5';
        $this->assertEquals( 0.5, Parser\tryParseNumber($expr, 0)->data);
        $expr = '.5';
        $this->assertEquals( 0.5, Parser\tryParseNumber($expr, 0)->data);
        $expr = '-0.5';
        $this->assertEquals( -0.5, Parser\tryParseNumber($expr, 0)->data);
    }

    function testTryPraseSexp() : void
    {
        $expr = '( 1 2 3)';
        $this->assertEquals( [1, 2, 3], Parser\tryParseSexp($expr, 0)->data);

        $expr = '()';
        $this->assertEquals( [], Parser\tryParseSexp($expr, 0)->data);

        $expr = '(1.5 "foobar" NIL)';
        $this->assertEquals( [1.5, 'foobar', false], Parser\tryParseSexp($expr, 0)->data);

        $expr = '("foo" NIL "bar")';
        $this->assertEquals( ['foo', false, 'bar'], Parser\tryParseSexp($expr, 0)->data);

        $expr = '(1 (2 3) 4)';
        $this->assertEquals( [1, [2, 3], 4], Parser\tryParseSexp($expr, 0)->data);
    }

    function testIsParensBalanced() : void
    {
        $expr = '()';
        $this->assertTrue(Parser\isParensBalanced($expr));

        $expr = '(()';
        $this->assertFalse(Parser\isParensBalanced($expr));
        $expr = ')(';
        $this->assertFalse(Parser\isParensBalanced($expr));
    }

    function testIsQuotesBalanced() : void
    {
        $expr = '""';
        $this->assertTrue(Parser\isQuotesBalanced($expr));

        $expr = '"""';
        $this->assertFalse(Parser\isQuotesBalanced($expr));
    }

    function testEncodeAtom() : void
    {
        $data = 'asd';
        $this->assertEquals('"asd"', Parser\encodeAtom($data));

        $data = 69;
        $this->assertEquals('69', Parser\encodeAtom($data));

        $data = 3.14;
        $this->assertEquals('3.14', Parser\encodeAtom($data));

        $data = -666.42;
        $this->assertEquals('-666.42', Parser\encodeAtom($data));

        $data = true;
        $this->assertEquals('T', Parser\encodeAtom($data));

        $data = false;
        $this->assertEquals('NIL', Parser\encodeAtom($data));
    }

    function testEncodeArray() : void
    {
        $data = [];
        $this->assertEquals('()', Parser\encodeArray($data));

        $data = [1, 2, 3];
        $this->assertEquals('(1 2 3)', Parser\encodeArray($data));

        $data = [[1, 2], [3, 4]];
        $this->assertEquals('((1 2) (3 4))', Parser\encodeArray($data));
    }

    function testEncode() : void
    {
        $testData = [
            'number' => 123,
            'digits' => [ '1', '2', '3' ],
            'attributes' => [
                'even' => false,
                'positive' => true
            ]
        ];

        $expected = '(:number 123 :digits ("1" "2" "3") :attributes (:even NIL :positive T))';
        $this->assertEquals($expected, Parser\encode($testData));
    }

    // function testEncodeLargePayload() : void
    // {}
}
