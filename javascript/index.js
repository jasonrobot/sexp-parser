/**
 * Encode/decode S-Expessions from Javascript. This is an alternative to using JSON
 * and works for many of the same usecases i.e. encoding data structures in strings
 * for storage, transmission, or inspection.
 *
 * This is what happens when you make a Lisp enthusiast write javascript all day.
 *
 * Example comparison between JSON and s-expressions
 *
 * {"number":123,"digits":["1","2","3"],"attributes":{"even":false,"positive":true}}
 * (:number 123 :digits ("1" "2" "3") :attributes (:even NIL :positive T))
 *
 * {
 *   number: 123,
 *   digits: ['1', '2', '3'],
 *   attributes: {
 *     even: false,
 *     positive: true
 *   }
 * }
 *
 * (:number 123
 *  :digits ("1" "2" "3")
 *  :attributes (:even NIL
 *               :positive T))
 */

// LISP-y syntax unification functions, because I'm weird

/**
 * lisp-inspired AND function
 */
const and = ( ...params ) => {
    return params.reduce( ( a, b ) => a && b, true );
};

/**
 * lisp-inspired OR function
 */
const or = ( ...params ) => {
    return params.reduce( ( a, b ) => a || b, false );
};

/**
 * lisp inspired NOT fucntion
 *
 * @param {Any} param param to negate, will be cast to boolean.
 * @return {boolean}
 */
const not = ( param ) => !Boolean( param );

/**
 * Return the first item of an array that passes a predicate.
 * Only evaluates items until one passes, then returns immediately.
 *
 * @param {[Any]} array An array of anything that PREDICATE can take as args.
 * @param {function} predicate Should return boolean, will be applied to items in ARRAY.
 */
const first = ( array, predicate ) => {
    for ( let index in array ) {
        const item = array[index];
        if ( predicate( item ) === true ) {
            return item;
        }
    }
    return undefined;
};

/********************************************************************/
/// Helper functions finish!
/// Parser code start!
/********************************************************************/

/**
 * Check if CHAR is the end of a symbol being evaluated.
 *
 * @param {string} char The character being checked
 * @return {boolean}
 */
const isEndOfSymbol = ( char ) => {
    return or( char === undefined,
               char === ' ',
               char === ')' );
};

/**
 * Find the position of the next char that passes a predicate.
 *
 * @param {string} string The string being checked over.
 * @param {int} position The starting position for scanning.
 * @param {function} fn The test applied to chars in the string. Optionally
 * can be a single character, which will be checked for equality.
 *
 * @return {int} the position of the next char that matched FN.
 */
const findNext = ( string, position, fn ) => {
    if ( and ( typeof fn === 'string',
               fn.length === 1 ) ) {
        let charArgument = fn;
        fn = (char) => char === charArgument;
    }

    while ( not( fn( string[ position ] ) ) ) {
        position += 1;
    }
    return position;
};

/**
 * Get the position of the next non-whitespace char.
 *
 * @param {string} string The string being checked over.
 * @param {int} position The starting position to check from.
 *
 * @return {int} Index of the next non-space char.
 */
const chompWhitespace = ( string, position ) => {
    while ( string[position] === ' ' ) {
        position += 1;
    }
    return position;
};

/**
 * Helper function that should ALWAYS BE USED to generate valid parsing results.
 *
 * @param {any|null} data
 * @param {int} next Index where to resume parsing.
 */
const ParserResult = ( data, next ) => {
    return { data, next };
};

const tryParseBoolean = ( expression, position ) => {
    if ( expression[ position ].toUpperCase() === 'T' &&
         isEndOfSymbol( expression[ position + 1 ] ) ) {
        return ParserResult( true, position + 1 );
    }

    if ( expression.substring( position, position + 3 ).toUpperCase() === 'NIL' ) {
        return ParserResult( false, position + 3 );
    }

    return ParserResult( null, position );
};

/**
 * Parse a string if possible.
 */
const tryParseString = ( expression, position ) => {
    if ( expression[ position ] !== '"' ) {
        return ParserResult( null, position );
    }
    const startPosition = position;
    //skip the first quote
    position += 1;

    position = findNext( expression, position, c => c === '"' );

    return ParserResult(
        expression.substring( startPosition + 1, position ),
        //skip the last quote
        position + 1
    );
};

/**
 * Parse a symbol if possible. Why do we use symbols? I dunno.
 *
 * TODO: Use symbols to let objects be declared?
 */
const tryParseSymbol = ( expression, position ) => {
    if ( expression[ position ] !== ':' ) {
        return ParserResult( null, position );
    }
    const startPosition = position;

    position = findNext( expression, position, isEndOfSymbol );

    return ParserResult(
        expression.substring( startPosition, position ),
        position
    );
};

/**
 * Parse a number if possible.
 */
const tryParseNumber = ( expression, position ) => {
    // /^[\d.-]
    const startPosition = position;
    position = findNext( expression, position, isEndOfSymbol );
    const value = Number( expression.substring( startPosition, position ) );
    return ParserResult( value, position );
};

/**
 * Given [ ':A', 1, ':B', 2 ], should produce { a: 1, b: 2 }
 */
const tryParseObject = ( array ) => {
    if ( array.length % 2 !== 0 ) {
        return array;
    }

    // grab what will be the object's keys
    const keys = [];
    for ( let index = 0; index < array.length; index += 2 ) {
        keys.push( array[ index ] );
    }

    // all need to be strings starting with a colon
    if ( not( keys.every( key => typeof key == 'string' && key.startsWith( ':' ) ) ) ) {
        return array;
    }

    // get the values for the keys
    const values = [];
    for ( let index = 1; index < array.length; index += 2 ) {
        values.push( array[ index ] );
    }

    const result = {};

    // merge them together
    for ( let index = 0; index < keys.length; index += 1 ) {
        let keyName = keys[ index ].substring( 1 );
        let value = values[ index ];

        result[ keyName ] = value;
    }

    return result;

};

/**
 * Parse an s-expression if possible.
 *
 * @return {ParserResult} Data will be null if an s-expression was not found.
 */
const tryParseSexp = ( expression, position = 0 ) => {
    if ( expression[ position ] !== '(' ) {
        return ParserResult( null, position );
    }

    const parsers = [
        tryParseSexp,
        tryParseString,
        tryParseSymbol,
        tryParseBoolean,
        tryParseNumber
    ];

    // we're going to keep using position
    position = position + 1;
    position = chompWhitespace( expression, position );

    // keep parsing from expression, updating position after every parse,
    // until the next non-whitespace token is close-paren
    let resultData = [];

    let parsedToken;
    // this is ok for nested expressions, because if recursive tryParseSexp
    // is successful, position skips over the nested close paren
    while ( expression[ position ] !== ')' ) {
        // console.log('starting token parse loop');

        // take the result of the first successful parser
        // RECURSION HAPPENS HERE!!!
        parsedToken = first( parsers, parser => {
            return parser( expression, position ).data !== null;
        } );
        parsedToken = parsedToken( expression, position );
        // if nothing parses the token, we're at the end. This is an error
        // and should never happen if the expression was balanced
        if ( parsedToken === undefined ) {
            break;
        }

        //add to result
        resultData.push( parsedToken.data );
        // move to the end of the token we just parsed
        position = parsedToken.next;
        // skip over any whitespace that follows the token
        while ( expression[ position ] === ' ' ) {
            position += 1;
        }

    }

    // TODO check if this can be a JS object
    resultData = tryParseObject( resultData );


    // move over the closing paren
    position += 1;

    return ParserResult(resultData, position);
};

/**
 * Check if parens are balanced in a string.
 */
const isParensBalanced = ( expression ) => {
    let netBalance = 0;
    for ( let position in expression ) {
        let char = expression[position];
        if ( char === '(' ) {
            netBalance += 1;
        }
        if ( char === ')' ) {
            netBalance -= 1;
        }
        if ( netBalance < 0 ) {
            return false;
        }
    }

    return netBalance === 0;
};

/**
 * Check if there are an even number of quotes in a string.
 */
const isQuotesBalanced = ( expression ) => {
    let quoteCount = 0;
    for ( let position in expression ) {
        let char = expression[position];
        if ( char === '"' ) {
            quoteCount += 1;
        }
    }
    return ( quoteCount % 2 ) === 0;
};

/**
 * Parse a whole expression. Main entry point for loading a whole expression.
 *
 * @param {string} expression The expression to be parsed.
 *
 * @return {Array} Regular javascript-friendly data.
 */
const parseExpression = ( expression ) => {
    if ( typeof expression != 'string' ) {
        throw 'You can only parse strings, ya dingus.';
    }

    expression = expression.trim();

    if ( not( isParensBalanced( expression ) ) ) {
        throw 'Unbalanced parens in expression.';
    }

    if ( not( isQuotesBalanced( expression ) ) ) {
        throw 'Unbalanced quotes in expression.';
    }

    let {data: sexpParseResult} = tryParseSexp( expression, 0 );

    if ( sexpParseResult === null ) {
        throw 'Parsing error in recursive descent.';
    }

    return sexpParseResult;
};

/********************************************************************/
/// Parser code finish!
/// Encoder code start!
/********************************************************************/


const encodeAtom = ( atom ) => {
    // console.log( `encoding atom: ${atom} :: ${typeof atom}` );
    if ( typeof atom === 'string' ) {
        return '"' + atom + '"';
    }
    if ( atom === false ) {
        return 'NIL';
    }
    if ( atom === true ) {
        return 'T';
    }
    return String(atom);
};

const encodeArray = ( array ) => {
    // console.log( `encoding array: ${array}` );
    const contents = array.map( (item) => {
        return encode(item);
    } );
    return `(${contents.join(' ')})`;
};

/**
 * Encode a javascript object.
 */
const encode = ( object ) => {
    if ( Array.isArray( object ) ) {
        return encodeArray( object );
    }
    else if ( typeof object !== 'object' ) {
        return encodeAtom( object );
    }

    // We can be fairly certain it's an object now.
    // {a: 1, b: 2} => [['a', 1], ['b', 2]] => [':a 1', ':b 2'] => ':a 1 :b 2'
    //           entries                   map                join(' ')
    const contents = Object.entries( object ).map( ( [key, value] ) => {
        return [
            ':' + key,
            encode( value )
        ].join( ' ' );
    } );

    return `(${contents.join( ' ' )})`;
};

/********************************************************************/
/// Encoder code finish!
/// Testing time!!!
/********************************************************************/

const test = require( 'tape' );

//TODO try parse bool!!!!
test( 'tryParseBoolean', ( t ) => {
    t.equal( tryParseBoolean( 'T', 0 ).data, true );

    t.equal( tryParseBoolean( 'NIL', 0 ).data, false );

    t.end();
} );

test( 'tryParseString', ( t ) => {
    t.equal( tryParseString( '"asdf"', 0 ).data, 'asdf',
             'parse string "asdf" data' );
    t.equal( tryParseString( '"asdf"', 0 ).next, 6,
             'parse string "asdf" next' );

    t.equal( tryParseString( '"asdf")', 0 ).data, 'asdf',
             'parse string "asdf)" data' );
    t.equal( tryParseString( '"asdf")', 0 ).next, 6,
             'parse string "asdf)" next' );

    t.equal( tryParseString( '\'asdf\'', 0 ).data, null,
             'string with single quotes' );

    t.equal( tryParseString( '"\""', 0 ).data, '"',
           'an escaped quote' );

    t.equal( tryParseString( '"\\"', 0 ).data, '\\',
           'single literal backslash' );
    t.end();
} );

test( 'tryParseSymbol', ( t ) => {
    t.equal( tryParseSymbol( ':foo', 0 ).data, ':foo',
             'symbol data' );
    t.equal( tryParseSymbol( ':foo', 0 ).next, 4,
             'symbol length' );

    t.equal( tryParseSymbol( ':bar)', 0 ).data, ':bar',
             'symbol data trailing paren' );
    t.equal( tryParseSymbol( ':bar)', 0 ).next, 4,
             'symbol next trailing paren' );

    t.equal( tryParseSymbol( ':cAsEsEnSiTiVe', 0 ).data, ':cAsEsEnSiTiVe',
             'should preserve case' );

    t.equal( tryParseSymbol( 'asdf', 0 ).data, null,
             'symbol without colon' );
    t.end();
} );

test( 'tryParseNumber', ( t ) => {
    t.equal( tryParseNumber( '12', 0 ).data, 12,
             'data 12' );
    t.equal( tryParseNumber( '12', 0 ).next, 2,
             'length 12 is 2' );

    t.equal( tryParseNumber( '-1', 0 ).data, -1,
             'data -1' );
    t.equal( tryParseNumber( '-1', 0 ).next, 2,
             'length -1 is 2' );

    t.equal( tryParseNumber( '0.5', 0 ).data, 0.5,
             'data 0.5' );
    t.equal( tryParseNumber( '0.5', 0 ).next, 3,
             'length 0.5 is 3' );

    t.equal( tryParseNumber( '.5', 0 ).data, 0.5,
             'data .5' );
    t.equal( tryParseNumber( '.5', 0 ).next, 2,
             'length .5 is 2' );

    t.equal( tryParseNumber( '-0.5', 0 ).data, -0.5,
             'data -0.5' );
    t.equal( tryParseNumber( '-0.5', 0 ).next, 4,
             'length -0.5 is 4' );

    t.equal( tryParseNumber( 'foo 12 bar', 4 ).data, 12,
             'data "foo 12 bar" is 12' );
    t.equal( tryParseNumber( 'foo 12 bar', 4 ).next, 6,
             'length "foo 12 bar" is 6' );

    t.equal( tryParseNumber( '2)', 0 ).data, 2,
             'trailing paren' );
    t.equal( tryParseNumber( '2)', 0 ).next, 1,
             'trailing paren length' );

    t.end();
} );

test( 'tryParseSexp', ( t ) => {
    t.deepEqual( tryParseSexp( '(1 2 3)', 0 ).data, [1, 2, 3] );
    t.equal( tryParseSexp( '(1 2 3)', 0 ).next, 7 );

    t.deepEqual( tryParseSexp( '()', 0).data, [] );
    t.deepEqual( tryParseSexp( '()', 0).next, 2 );

    t.test( 'nested expressions', ( st ) => {
        st.deepEqual( tryParseSexp( '(1 (2 3) 4)', 0 ).data, [1, [2, 3], 4] );
        st.deepEqual( tryParseSexp( '(1 (2 3) 4)', 0 ).next, 11 );

        st.deepEqual( tryParseSexp( '(())', 0 ).data, [[]] );
        st.deepEqual( tryParseSexp( '(())', 0 ).next, 4 );

        st.deepEqual( tryParseSexp( '( ( ) )', 0 ).data, [[]] );
        st.deepEqual( tryParseSexp( '( ( ) )', 0 ).next, 7 );

        st.deepEqual( tryParseSexp( '(() () ())', 0 ).data, [[], [], []],
                      '(() () ())' );

        st.deepEqual( tryParseSexp( '( ( 2 ) 3)', 0).data, [[2], 3] );

        st.end();
    } );

    t.test( 'parsing key-value objects', ( st ) => {
        let input, expected;

        input = '(:a 1)';
        expected = {a: 1};
        st.deepEqual( tryParseSexp( input, 0 ).data, expected );

        input = '(:foo 123 :bar "asd")';
        expected = { foo: 123, bar: 'asd' };
        st.deepEqual( tryParseSexp( input, 0 ).data, expected );

        input = '(:a (:b (:c 69)))';
        expected = { a: { b: { c: 69 } } };
        st.deepEqual( tryParseSexp( input, 0 ).data, expected,
                      'parsing nested objects: (:a (:b (:c 69)))' );

        st.deepEqual( tryParseSexp( '(:key "value")', 0 ).data, {key: 'value'},
                      'Parsing something object-like.' );


        st.end();
    } );

    t.end();
} );

test( 'tryParseObject', ( t ) => {
    let array = [':foo', 123, ':bar', 'asd'];
    let expected = { foo: 123, bar: 'asd' };
    t.deepEqual( tryParseObject( array ), expected );

    array = [ ':A', [ ':B', [ ':C', 69 ] ] ];
    expected = { A: [ ':B', [ ':C', 69 ] ] };
    t.deepEqual( tryParseObject( array ), expected,
                 'should only do the first level of an array' );

    t.end();
} );

test( 'chompWhitespace', ( t ) => {
    t.equal( chompWhitespace( ' a', 0 ), 1,
             '" a" should give position 1' );

    t.end();
} );

test( 'isParensBalanced', ( t ) => {
    t.ok( isParensBalanced( '()' ), '()' );
    t.ok( isParensBalanced( '(()()(()))' ), '(()()(()))' );
    t.ok( isParensBalanced( '(works (with ( stuff )in )between )' ), '(works (with ( stuff )in )between )' );

    t.notOk( isParensBalanced( ')(' ), 'close before open' );
    t.notOk( isParensBalanced( '(' ), 'just one open' );
    t.notOk( isParensBalanced( ')' ), 'just one close' );
    t.notOk( isParensBalanced( '())' ), '())' );
    t.notOk( isParensBalanced( '(()' ), '(()' );

    t.end();
} );

test( 'isQuotesBalanced', ( t ) => {
    t.ok( isQuotesBalanced( '' ), 'zero quotes' );
    t.ok( isQuotesBalanced( '""' ), 'two quotes' );

    t.notOk( isQuotesBalanced( '"""' ), 'three quotes' );

    t.end();
} );

test( 'encodeAtom', ( t ) => {
    t.equal( encodeAtom( "asd" ), '"asd"' );
    t.equal( encodeAtom( 69 ), '69' );

    t.equal( encodeAtom( true ), 'T', 'true should be T' );
    t.equal( encodeAtom( false ), 'NIL', 'false should be NIL' );

    t.end();
} );

test( 'encodeArray', ( t ) => {
    t.equal( encodeArray( [] ), '()' );
    t.equal( encodeArray( [1, 2, 3] ), '(1 2 3)' );

    t.equal( encodeArray( [[1, 2], [3, 4]] ), '((1 2) (3 4))' );

    t.end();
} );

test( 'encode', ( t ) => {
    let actual = encode( {
        number: 123,
        digits: ['1', '2', '3'],
        attributes: {
            even: false,
            positive: true
        }
    } );
    let expected = '(:number 123 :digits ("1" "2" "3") :attributes (:even NIL :positive T))';

    t.equal( actual, expected, 'large encoding sample' );

    // t.equal( 'encode',
    t.end();
} );

test( 'large round trip test', ( t ) => {
    const largeDataPayload = [
        {
            "_id": "5c77256b120e71539a4543a7",
            "index": 0,
            "guid": "c9815eb2-fdc5-42f8-bbb3-c2dadaf4c1b8",
            "isActive": true,
            "balance": "$1,556.23",
            "picture": "http://placehold.it/32x32",
            "age": 40,
            "eyeColor": "brown",
            "name": "Dora Weiss",
            "gender": "female",
            "company": "CIRCUM",
            "email": "doraweiss@circum.com",
            "phone": "+1 (957) 431-3727",
            "address": "219 Chase Court, Hebron, New Jersey, 6091",
            "about": "Quis ipsum eu deserunt ut mollit est eu duis commodo reprehenderit cupidatat nulla ad aliquip. Tempor nulla in consequat est voluptate veniam excepteur pariatur sunt sint. Veniam laborum aliqua esse elit qui est exercitation velit. Mollit qui exercitation nulla elit ex ad aute laborum reprehenderit. Quis ipsum proident velit do. Dolor dolore incididunt aliquip culpa cillum enim. Id incididunt ullamco aliquip id mollit elit ullamco qui duis ut mollit.\r\n",
            "registered": "2014-08-01T12:47:41 +07:00",
            "latitude": -82.633003,
            "longitude": 4.637068,
            "tags": [
                "fugiat",
                "eu",
                "Lorem",
                "laborum",
                "fugiat",
                "pariatur",
                "ex"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Lynette Mccarthy"
                },
                {
                    "id": 1,
                    "name": "Leila Medina"
                },
                {
                    "id": 2,
                    "name": "Kasey Moss"
                }
            ],
            "greeting": "Hello, Dora Weiss! You have 9 unread messages.",
            "favoriteFruit": "banana"
        },
        {
            "_id": "5c77256ba6e9551c135fc72f",
            "index": 1,
            "guid": "ec2b621f-e35a-4447-9ecb-c3bee2feeeea",
            "isActive": true,
            "balance": "$1,782.51",
            "picture": "http://placehold.it/32x32",
            "age": 30,
            "eyeColor": "blue",
            "name": "Karen Hernandez",
            "gender": "female",
            "company": "CONCILITY",
            "email": "karenhernandez@concility.com",
            "phone": "+1 (853) 530-3600",
            "address": "478 Schenck Street, Roland, Federated States Of Micronesia, 8478",
            "about": "Esse id do irure ipsum quis occaecat cillum pariatur est ipsum esse exercitation reprehenderit aliqua. Ea nostrud fugiat sunt sunt. Ut aute voluptate consequat occaecat cupidatat magna irure. Occaecat sunt fugiat laboris est labore laborum dolor reprehenderit irure ipsum officia voluptate id nisi. Duis consequat minim nostrud magna nostrud consequat eiusmod nulla qui sunt incididunt cupidatat. Lorem ullamco aliqua officia adipisicing eiusmod labore incididunt irure aute nulla aliquip laborum cillum.\r\n",
            "registered": "2016-03-14T11:34:25 +07:00",
            "latitude": -5.325438,
            "longitude": 18.0786,
            "tags": [
                "exercitation",
                "sit",
                "ad",
                "sit",
                "fugiat",
                "enim",
                "non"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Marilyn Mooney"
                },
                {
                    "id": 1,
                    "name": "Cindy Nunez"
                },
                {
                    "id": 2,
                    "name": "Ramirez Gilmore"
                }
            ],
            "greeting": "Hello, Karen Hernandez! You have 4 unread messages.",
            "favoriteFruit": "strawberry"
        },
        {
            "_id": "5c77256bef0f2c88b63e1c2a",
            "index": 2,
            "guid": "7f91e154-37c3-40ca-b240-71854027eb7f",
            "isActive": true,
            "balance": "$2,210.88",
            "picture": "http://placehold.it/32x32",
            "age": 26,
            "eyeColor": "brown",
            "name": "Short Page",
            "gender": "male",
            "company": "PLEXIA",
            "email": "shortpage@plexia.com",
            "phone": "+1 (834) 421-2685",
            "address": "129 Taaffe Place, Belmont, New Mexico, 7156",
            "about": "Ipsum minim eiusmod cupidatat irure. Adipisicing voluptate ex mollit reprehenderit. Occaecat aliqua proident enim cillum adipisicing. Do adipisicing incididunt sit non cillum. Aute duis dolor incididunt nulla sit duis cillum non id.\r\n",
            "registered": "2019-01-20T12:58:27 +08:00",
            "latitude": -10.195242,
            "longitude": 7.95824,
            "tags": [
                "occaecat",
                "proident",
                "pariatur",
                "officia",
                "eiusmod",
                "velit",
                "laboris"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Naomi Jennings"
                },
                {
                    "id": 1,
                    "name": "Blankenship Pruitt"
                },
                {
                    "id": 2,
                    "name": "Collins Carney"
                }
            ],
            "greeting": "Hello, Short Page! You have 3 unread messages.",
            "favoriteFruit": "strawberry"
        },
        {
            "_id": "5c77256b4b4fbbd1e17ea23e",
            "index": 3,
            "guid": "39955cf0-3a93-4fa8-a85f-882bdcfc43c7",
            "isActive": true,
            "balance": "$3,613.59",
            "picture": "http://placehold.it/32x32",
            "age": 30,
            "eyeColor": "green",
            "name": "Katelyn Bruce",
            "gender": "female",
            "company": "ZOINAGE",
            "email": "katelynbruce@zoinage.com",
            "phone": "+1 (962) 514-3834",
            "address": "201 Irwin Street, Succasunna, Texas, 1045",
            "about": "Commodo elit laborum amet mollit. Non aute irure esse esse est anim ea mollit qui commodo. Do dolor occaecat Lorem incididunt qui anim commodo sunt. Occaecat cupidatat occaecat eiusmod dolore officia excepteur culpa laborum id eiusmod velit. Voluptate non cillum id nulla deserunt consectetur esse sunt quis. Eiusmod et anim occaecat sunt aute do aliqua id reprehenderit voluptate occaecat duis aliqua. Veniam nostrud velit laboris excepteur occaecat est elit.\r\n",
            "registered": "2014-08-27T03:12:23 +07:00",
            "latitude": 61.029178,
            "longitude": 51.670902,
            "tags": [
                "consectetur",
                "deserunt",
                "irure",
                "occaecat",
                "voluptate",
                "sint",
                "esse"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Daniel Lopez"
                },
                {
                    "id": 1,
                    "name": "Marks Herman"
                },
                {
                    "id": 2,
                    "name": "Salas Meyers"
                }
            ],
            "greeting": "Hello, Katelyn Bruce! You have 6 unread messages.",
            "favoriteFruit": "banana"
        },
        {
            "_id": "5c77256b46d29e2d9705b2d7",
            "index": 4,
            "guid": "d71fd89c-7191-4186-b653-ccffddbf1d04",
            "isActive": true,
            "balance": "$3,055.55",
            "picture": "http://placehold.it/32x32",
            "age": 25,
            "eyeColor": "blue",
            "name": "Hodges Espinoza",
            "gender": "male",
            "company": "MEMORA",
            "email": "hodgesespinoza@memora.com",
            "phone": "+1 (973) 425-2889",
            "address": "199 Florence Avenue, Alamo, Vermont, 1187",
            "about": "Lorem culpa sunt esse est ut et ea ea cillum enim commodo. Quis laborum officia deserunt amet magna culpa irure. Pariatur aliquip sint commodo esse in pariatur sint ullamco adipisicing reprehenderit id ea. Occaecat officia veniam nostrud sit ex velit incididunt. Tempor do aliquip cillum irure adipisicing. Ut ut sit voluptate voluptate adipisicing labore.\r\n",
            "registered": "2014-01-22T04:07:00 +08:00",
            "latitude": -10.760669,
            "longitude": 10.497581,
            "tags": [
                "laboris",
                "ut",
                "qui",
                "magna",
                "minim",
                "dolore",
                "ullamco"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Pacheco Matthews"
                },
                {
                    "id": 1,
                    "name": "Lori Battle"
                },
                {
                    "id": 2,
                    "name": "Anthony Cote"
                }
            ],
            "greeting": "Hello, Hodges Espinoza! You have 5 unread messages.",
            "favoriteFruit": "banana"
        },
        {
            "_id": "5c77256b9fe07cb9744a80c3",
            "index": 5,
            "guid": "38d6f176-ef52-4aa1-9747-613a43212bc9",
            "isActive": true,
            "balance": "$3,356.10",
            "picture": "http://placehold.it/32x32",
            "age": 36,
            "eyeColor": "blue",
            "name": "Booth Beard",
            "gender": "male",
            "company": "PHARMEX",
            "email": "boothbeard@pharmex.com",
            "phone": "+1 (947) 526-2640",
            "address": "294 Marconi Place, Kanauga, Idaho, 8886",
            "about": "Elit ad aliquip ad nostrud eu culpa elit voluptate consectetur qui excepteur. Fugiat aute voluptate minim exercitation sit. Dolore deserunt pariatur sit nulla. Duis velit cillum ipsum anim velit adipisicing nulla nulla sit magna amet. Aliqua nisi quis sit consectetur aliquip dolor nisi excepteur deserunt occaecat reprehenderit quis nulla. Eiusmod fugiat culpa ullamco tempor cillum commodo. Veniam quis velit aliqua do ea velit enim velit ea irure aliquip ex laboris.\r\n",
            "registered": "2017-05-28T05:18:10 +07:00",
            "latitude": -62.281245,
            "longitude": 169.880199,
            "tags": [
                "deserunt",
                "amet",
                "eu",
                "pariatur",
                "consequat",
                "non",
                "exercitation"
            ],
            "friends": [
                {
                    "id": 0,
                    "name": "Lorna Barker"
                },
                {
                    "id": 1,
                    "name": "Alyssa Carroll"
                },
                {
                    "id": 2,
                    "name": "Marcy Jacobs"
                }
            ],
            "greeting": "Hello, Booth Beard! You have 6 unread messages.",
            "favoriteFruit": "strawberry"
        }
    ];

    t.deepEqual( parseExpression( encode( largeDataPayload ) ), largeDataPayload );

    t.end();
} );
if ( typeof module !== 'undefined' ) {
    module.exports = {
        chompWhitespace,
        findEndOfSymbol,
        tryParseBoolean,
        tryParseString,
        tryParseSymbol,
        tryParseNumber,
        tryParseSexp,
        tryParseObject,
        isParensBalanced,
        isQuotesBalanced,
        parse: parseExpression,
        encodeAtom,
        encodeArray,
        encode
    };
}
