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

if ( typeof module !== 'undefined' ) {
    module.exports = {
        chompWhitespace,
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
