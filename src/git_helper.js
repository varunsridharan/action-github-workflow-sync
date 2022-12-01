const nodeexec = require( '../node-exec' );
const gh_core  = require( '@actions/core' );
const log      = require( '../logger/index' );
const toolkit  = require( 'actions-js-toolkit' );

const findPullRequest = async( local_path ) => {
	let cmd    = `gh pr list --state=open --search-"minor CHORE Files Sync From ${toolkit.input.env( 'GITHUB_REPOSITORY')}"`;

	await nodeexec( `${cmd}`).then( () => {
		if( show_log ) {
			log.success( 'Existing PR found' );
		}
	} ).catch( ( error ) => {
		if( show_log ) {
			log.error( 'Unable to find an existing PR' );
			gh_core.error( error );
		}
		status = false;
	} );
	return status;
};


module.exports = {
    findPullRequest: findPullRequest,
}
