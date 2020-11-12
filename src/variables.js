const core = require( '@actions/core' );

const AUTO_CREATE_NEW_BRANCH = core.getInput( 'AUTO_CREATE_NEW_BRANCH' );
const COMMIT_EACH_FILE       = core.getInput( 'COMMIT_EACH_FILE' );
const DRY_RUN                = core.getInput( 'DRY_RUN' );
const GITHUB_TOKEN           = core.getInput( 'GITHUB_TOKEN' );
const RAW_REPOSITORIES       = core.getInput( 'REPOSITORIES' );
const RAW_WORKFLOW_FILES     = core.getInput( 'WORKFLOW_FILES' );
const WORKFLOW_FILES_DIR     = core.getInput( 'WORKFLOW_FILES_DIR' );
const REPOSITORIES           = RAW_REPOSITORIES.split( '\n' );
const WORKFLOW_FILES         = RAW_WORKFLOW_FILES.split( '\n' );

module.exports = {
	AUTO_CREATE_NEW_BRANCH,
	COMMIT_EACH_FILE,
	DRY_RUN,
	GITHUB_TOKEN,
	RAW_REPOSITORIES,
	RAW_WORKFLOW_FILES,
	WORKFLOW_FILES_DIR,
	REPOSITORIES,
	WORKFLOW_FILES,
}