//let exports = module.export = {};

// LISP-y syntax unification functions

const and = ( ...params ) => {
    return params.reduce( ( a, b ) => a && b, true );
};

const or = ( ...params ) => {
    return params.reduce( ( a, b ) => a || b, false );
};

const not = ( param ) => !Boolean( param );

const eq = ( ...params ) => {
    if ( params.length < 2 ) {
        return undefined;
    }
    return (
        params
            .slice( 1 )
            .reduce( ( a, b ) => a === b,
                     params[ 0 ] )
    );
};

const first = ( array, predicate ) => {
    for ( let index in array ) {
        const item = array[index];
        if ( predicate( item ) === true ) {
            return item;
        }
    }
    return undefined;
};

const isParen = ( char ) => {
    return ( char === '(' ||
             char === ')' );
};

const isWhitespace = ( char ) => {
    return or( char === undefined,
               char === ' ' );
};

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

const ParserResult = ( data, next ) => {
    return { data, next };
};

const isParserResult = ( obj ) => {
    const properties = [
        'data',
        'next'
    ];

    return and(
        Object.keys( obj ).length === properties.length,
        properties.every( p => obj.hasOwnProperty( p ) )
    );
};

/**
 * TODO check paren balance in top level, probably quote balance too
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
    const endPosition = 1 + findNext( expression, position, ')' );

    // keep parsing from expression, updating position after every parse,
    // until the next non-whitespace token is close-paren
    let resultData = [];

    let parsedToken;
    do {
        console.log('starting token parse loop');
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

    } while (
        expression[ position ] !== ')'
    )

    // move over the closing paren
    position += 1;

    return ParserResult(resultData, position);
};

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

const tryParseSymbol = ( expression, position ) => {
    if ( expression[ position ] !== ':' ) {
        return ParserResult( null, position );
    }
    const startPosition = position;

    position = findNext( expression, position, isWhitespace );

    return ParserResult(
        expression.substring( startPosition + 1, position ),
        position
    );
};

const tryParseNumber = ( expression, position ) => {
    // /^[\d.-]
    const startPosition = position;
    position = findNext( expression, position, (c) => c == ' ' || c == ')' || c === undefined );
    const value = Number( expression.substring( startPosition, position ) );
    return ParserResult( value, position );
};

const parseSexpr = ( expression, position ) => {
    if ( typeof expression != 'string' ) {
        throw 'You can only parse strings, ya dingus.';
    }

    if ( expression.trim()[ 0 ] != '(' &&
         expression.trim()[ -1 ] != ')' ) {
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

test.skip( 'tryParseString', ( t ) => {
    t.equal( tryParseString( '"asdf"', 0 ).data, 'asdf' );
    t.equal( tryParseString( '"asdf"', 0 ).next, 6 );

    t.equal( tryParseString( '"asdf")', 0 ).data, 'asdf' );
    t.equal( tryParseString( '"asdf")', 0 ).next, 6 );

    t.equal( tryParseString( '\'asdf\'', 0 ).data, null );
    t.end();
} );

test.skip( 'tryParseSymbol', ( t ) => {
    t.equal( tryParseSymbol( ':foo', 0 ).data, 'foo' );
    t.equal( tryParseSymbol( ':foo', 0 ).next, 4 );

    t.equal( tryParseSymbol( ':bar)', 0 ).data, 'bar' );
    t.equal( tryParseSymbol( ':bar)', 0 ).next, 4 );

    t.equal( tryParseSymbol( 'asdf', 0 ).data, null );
    t.end();
} );

test.skip( 'tryParseNumber', ( t ) => {
    t.equal( tryParseNumber( '12', 0 ).data, 12 );
    t.equal( tryParseNumber( '12', 0 ).next, 2 );

    t.equal( tryParseNumber( '-1', 0 ).data, -1 );
    t.equal( tryParseNumber( '-1', 0 ).next, 2 );

    t.equal( tryParseNumber( '0.5', 0 ).data, 0.5 );
    t.equal( tryParseNumber( '0.5', 0 ).next, 3 );

    t.equal( tryParseNumber( '.5', 0 ).data, 0.5 );
    t.equal( tryParseNumber( '.5', 0 ).next, 2 );

    t.equal( tryParseNumber( '-0.5', 0 ).data, -0.5 );
    t.equal( tryParseNumber( '-0.5', 0 ).next, 4 );

    t.equal( tryParseNumber( 'foo 12 bar', 4 ).data, 12 );
    t.equal( tryParseNumber( 'foo 12 bar', 4 ).next, 6 );

    t.equal( tryParseNumber( '2)', 0 ).data, 2 );
    t.equal( tryParseNumber( '2)', 0 ).next, 1 );

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
        st.end();
    } );

    t.end();
} );
