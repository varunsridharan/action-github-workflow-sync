const spawn = require( 'child_process' ).spawn;
const path  = require( "path" );

const exec = ( cmd, args = [] ) => new Promise( ( resolve, reject ) => {
	const app = spawn( cmd, args, { stdio: 'inherit' } );
	app.on( 'close', code => {
		if( code !== 0 ) {
			err      = new Error( `Invalid status code: ${code}` );
			err.code = code;
			return reject( err );
		}
		return resolve( code );
	} );
	app.on( 'error', reject );
} );

const main = async() => {
	await exec( 'bash', [ path.join( __dirname, './entrypoint.sh' ) ] );
};


main();