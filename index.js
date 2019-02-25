//let exports = module.export = {};

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

// Parser code start!

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

/**
 * Parse an s-expression if possible.
 *
 * @return {ParserResult} Data will be null if an s-expression was not found.
 */
const tryParseSexp = ( expression, position ) => {
    if ( expression[ position ] !== '(' ) {
        return ParserResult( null, position );
    }

    const parsers = [
        tryParseSexp,
        tryParseString,
        tryParseSymbol,
        tryParseNumber
    ];

    // we're going to keep using position
    position = position + 1;
    position = chompWhitespace( expression, position );
    const endPosition = 1 + findNext( expression, position, ')' );

    // keep parsing from expression, updating position after every parse,
    // until the next non-whitespace token is close-paren
    let resultData = [];

    let parsedToken;
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

    // move over the closing paren
    position += 1;

    return ParserResult(resultData, position);
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
        expression.substring( startPosition + 1, position ),
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

    if ( expression[ 0 ] != '(' &&
         expression[ -1 ] != ')' ) {
        throw 'That\'s not a s-expression.';
    }

    //now, should just have the contents of the expr
    expression = expression.trim().substring( 1, expression.length - 1 );

    let index = 0;
    while ( index < expression.length ) {
        let char = expression[ index ];

        while ( expression[ index ] === ' ' ) {
            index += 1;
        }

        let parsedSymbol;

        index += parsedSymbol.length;

        parsedSymbol = tryParseSexp( expression, index );
    }
};

const test = require( 'tape' );

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
    t.end();
} );

test( 'tryParseSymbol', ( t ) => {
    t.equal( tryParseSymbol( ':foo', 0 ).data, 'foo',
           'symbol data' );
    t.equal( tryParseSymbol( ':foo', 0 ).next, 4,
           'symbol length' );

    t.equal( tryParseSymbol( ':bar)', 0 ).data, 'bar',
           'symbol data trailing paren' );
    t.equal( tryParseSymbol( ':bar)', 0 ).next, 4,
           'symbol next trailing paren' );

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


        st.end();
    } );

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
    t.ok( isParensBalanced( '(works(with(stuff)in)between)' ), '(works (with ( stuff ) in) between )' );

    t.notOk( isParensBalanced( ')(' ), 'close before open' );
    t.notOk( isParensBalanced( '(' ), 'just one open' );
    t.notOk( isParensBalanced( ')' ), 'just one close' );
    t.notOk( isParensBalanced( '())' ), '())' );
    t.notOk( isParensBalanced( '(()' ), '(()' );

    t.end();
} );

test( 'isQuotesBalanced', ( t ) => {
    t.ok( isQuotesBalanced( '' ) );

    t.ok( isQuotesBalanced( '""' ) );

    t.notOk( isQuotesBalanced( '"""' ) );

    t.end();
} );
