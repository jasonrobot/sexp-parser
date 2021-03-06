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

/**
 * Check if CHAR is the end of a symbol being evaluated.
 *
 * @param {string} char The character being checked
 * @return {boolean}
 */
function isEndOfSymbol( char ) {
    return ( char === undefined ||
             char === ' ' ||
             char === ')' );
};

function findEndOfSymbol(string, position) {
    const nextSpace = string.indexOf( ' ', position );
    const nextParen = string.indexOf( ')', position );

    // There is no end of next symbol, so our terminus is the end of the whole string.
    if ( nextSpace === -1 && nextParen === -1 ) {
        return string.length;
    }
    if ( nextSpace === -1 ) { return nextParen; }
    if ( nextParen === -1 ) { return nextSpace; }
    return nextSpace < nextParen ? nextSpace : nextParen;
};

/**
 * Get the position of the next non-whitespace char.
 *
 * @param {string} string The string being checked over.
 * @param {int} position The starting position to check from.
 *
 * @return {int} Index of the next non-space char.
 */
function chompWhitespace( string, position ) {
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
function ParserResult( data, next ) {
    return { data, next };
};

function tryParseBoolean( expression, position ) {
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
function tryParseString( expression, position ) {
    if ( expression[ position ] !== '"' ) {
        return ParserResult( null, position );
    }
    const startPosition = position;
    //skip the first quote
    position += 1;

    position = expression.indexOf( '"', position );

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
function tryParseSymbol( expression, position ) {
    if ( expression[ position ] !== ':' ) {
        return ParserResult( null, position );
    }
    const startPosition = position;

    position = findEndOfSymbol( expression, position );

    return ParserResult(
        expression.substring( startPosition, position ),
        position
    );
};

/**
 * Parse a number if possible.
 */
function tryParseNumber( expression, position ) {
    // /^[\d.-]
    const startPosition = position;

    position = findEndOfSymbol( expression, position );
    const value = Number( expression.substring( startPosition, position ) );
    if ( Number.isNaN( value ) ) {
        return ParserResult( null, position );
    }
    return ParserResult( value, position );
};

/**
 * Given [ ':A', 1, ':B', 2 ], should produce { a: 1, b: 2 }
 */
function tryParseObject( array ) {
    if ( array.length % 2 !== 0 ) {
        return array;
    }

    const result = {};

    for ( let index = 0; index < array.length; index += 2 ) {
        const key = array[ index ];
        if ( typeof key !== 'string' || key[0] !== ':' ) {
            return array;
        }

        const value = array[ index + 1 ];
        result[ key.substring( 1 ) ] = value;
    }

    return result;

};

/**
 * Parse an s-expression if possible.
 *
 * @return {ParserResult} Data will be null if an s-expression was not found.
 */
function tryParseSexp( expression, position = 0 ) {
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

        const tryParsers = () => {
            const maybeNumber = tryParseNumber( expression, position );
            if ( maybeNumber.data !== null ) { return maybeNumber; }

            const maybeBool = tryParseBoolean( expression, position );
            if ( maybeBool.data !== null ) { return maybeBool; }

            const maybeSymbol = tryParseSymbol( expression, position );
            if ( maybeSymbol.data !== null ) { return maybeSymbol; }

            const maybeString = tryParseString( expression, position );
            if ( maybeString.data !== null ) { return maybeString; }

            const maybeSexp = tryParseSexp( expression, position );
            if ( maybeSexp.data !== null ) { return maybeSexp; }

            return undefined;
        };

        parsedToken = tryParsers();
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
function isParensBalanced( expression ) {
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
function isQuotesBalanced( expression ) {
    const matches = expression.match( /"/g );
    return matches === null || matches.length % 2 === 0;
};

/**
 * Parse a whole expression. Main entry point for loading a whole expression.
 *
 * @param {string} expression The expression to be parsed.
 *
 * @return {Array} Regular javascript-friendly data.
 */
function parseExpression( expression ) {
    if ( typeof expression != 'string' ) {
        throw 'You can only parse strings, ya dingus.';
    }

    expression = expression.trim();

    // if ( not( isParensBalanced( expression ) ) ) {
    //     throw 'Unbalanced parens in expression.';
    // }

    // if ( !( isQuotesBalanced( expression ) ) ) {
    //     throw 'Unbalanced quotes in expression.';
    // }

    let sexpParseResult = tryParseSexp( expression, 0 ).data;

    if ( sexpParseResult === null ) {
        throw 'Parsing error in recursive descent.';
    }

    return sexpParseResult;
};

/********************************************************************/
/// Parser code finish!
/// Encoder code start!
/********************************************************************/


function encodeAtom( atom ) {
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

function encodeArray( array ) {
    let contents = '';
    for ( let i = 0; i < array.length; i++ ) {
        contents += encode( array[i] ) + ' ';
    }
    contents = contents.trim();
    return '(' + contents  + ')';
};

/**
 * Encode a javascript object.
 */
function encode( object ) {
    if ( Array.isArray( object ) ) {
        return encodeArray( object );
    }
    else if ( typeof object !== 'object' ) {
        return encodeAtom( object );
    }

    let contents = '';
    for ( let key in object ) {
        const value = encode( object[ key ] );

        contents += ':' + key + ' ' + value + ' ';
    }
    contents = contents.trim();
    return '(' + contents + ')';
};

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
