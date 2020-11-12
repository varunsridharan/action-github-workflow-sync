const core = require( '@actions/core' );

async function run() {
	let $autobranch       = require( './inputs/auto-branch' );
	let $commiteachfile   = require( './inputs/commit-each-file' );
	let $dryrun           = require( './inputs/dry-run' );
	let $githubtoken      = require( './inputs/github-token' );
	let $rawrepositories  = require( './inputs/raw-repositories' );
	let $rawworkflowfiles = require( './inputs/raw-workflow-files' );
	let $workflowsdir     = require( './inputs/workflows-dir' );

	core.info( '"-------------------------------------------------------"' );
	core.info( '⚙️ Basic Config' );
	core.info( `  * $autobranch               : ${$autobranch}` );
	core.info( `  * $commiteachfile               : ${$commiteachfile}` );
	core.info( `  * $dryrun               : ${$dryrun}` );
	core.info( `  * $githubtoken               : ${$githubtoken}` );
	core.info( `  * $rawrepositories               : ${$rawrepositories}` );
	core.info( `  * $rawworkflowfiles               : ${$rawworkflowfiles}` );
	core.info( `  * $workflowsdir               : ${$workflowsdir}` );

	core.info( '"-------------------------------------------------------"' );
}

run();


