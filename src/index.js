const core       = require( '@actions/core' );
const exec       = require( '@actions/exec' );
const io         = require( '@actions/io' );
const toolkit    = require( 'actions-js-toolkit' );
const helper     = require( './helper' );
const octokit    = require("@octokit/core");
const retry      = require("@octokit/plugin-retry");
const throttling = require("@octokit/plugin-throttling");

async function run() {
	let AUTO_CREATE_NEW_BRANCH = require( './variables' ).AUTO_CREATE_NEW_BRANCH;
	let COMMIT_EACH_FILE       = require( './variables' ).COMMIT_EACH_FILE;
	let DRY_RUN                = require( './variables' ).DRY_RUN;
	let GITHUB_TOKEN           = require( './variables' ).GITHUB_TOKEN;
	let GIT_URL                = require( './variables' ).GIT_URL;
	let WORKFLOW_FILES_DIR     = require( './variables' ).WORKFLOW_FILES_DIR;
	let WORKSPACE              = require( './variables' ).WORKSPACE;
	let REPOSITORIES           = require( './variables' ).REPOSITORIES;
	let WORKFLOW_FILES         = require( './variables' ).WORKFLOW_FILES;
	let PULL_REQUEST           = require( './variables' ).PULL_REQUEST;
	let SKIP_CI                = require( './variables' ).SKIP_CI;
	let COMMIT_MESSAGE         = require( './variables' ).COMMIT_MESSAGE;
	let RETRY_MODE             = require( './variables' ).RETRY_MODE;

	toolkit.log( '-------------------------------------------------------' );
	toolkit.log( '⚙️ Basic Config' );
	toolkit.log( `  * AUTO_CREATE_NEW_BRANCH     : ${AUTO_CREATE_NEW_BRANCH}` );
	toolkit.log( `  * COMMIT_EACH_FILE           : ${COMMIT_EACH_FILE}` );
	toolkit.log( `  * PULL_REQUEST               : ${PULL_REQUEST}` );
	toolkit.log( `  * DRY_RUN                    : ${DRY_RUN}` );
	toolkit.log( `  * WORKFLOW_FILES_DIR         : ${WORKFLOW_FILES_DIR}` );
	toolkit.log( `  * WORKSPACE                  : ${WORKSPACE}` );
	toolkit.log( `  * SKIP_CI                    : ${SKIP_CI}` );
	toolkit.log( `  * COMMIT_MESSAGE             : ${COMMIT_MESSAGE}` );
	toolkit.log( `  * RETRY_MODE                 : ${RETRY_MODE}` );
	toolkit.log( '-------------------------------------------------------' );
	toolkit.log( '' );

	/**
	 * General Config
	 */
	await exec.exec( 'git config --global core.longpaths true', [], { silent: true } );
	await io.mkdirP( WORKSPACE );

	/**
	 * Instantiate an Octokit client shared between all asynchronous tasks
	 */
	// instantiate a basic octokit with auth
	var finalOctokit = new octokit.Octokit({auth: GITHUB_TOKEN})
	// override the octokit instance with retry/throttling plugin if required
	if (RETRY_MODE) {
		enhancedOctokit = octokit.Octokit.plugin(retry.retry, throttling.throttling)
		finalOctokit = new enhancedOctokit(
			{
				auth: GITHUB_TOKEN,
				throttle: {
					onRateLimit: (retryAfter, options) => {
						toolkit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
						if (options.request.retryCount === 0) {
							// only retries once
							toolkit.log.yellow(`Retrying after ${retryAfter} seconds!`);
							return true;
						}
					},
					onAbuseLimit: (retryAfter, options) => { // does not retry, only logs a warning
						toolkit.log.warn(`Abuse detected for request ${options.method} ${options.url}`);
					},
				},
				retry: { doNotRetry: ["429"]}
			}
		);
	}
	

	/**
	 * Loop Handler.
	 */
	await toolkit.asyncForEach( REPOSITORIES, async function( raw_repository ) {
		core.startGroup( `📓 ${raw_repository}` );
		toolkit.log.magenta( `⚙️ Repository Config` );
		let { repository, branch, owner, git_url, local_path } = helper.repositoryDetails( raw_repository );
		toolkit.log( `	Slug        : ${repository}` );
		toolkit.log( `	Owner       : ${owner}` );
		toolkit.log( `	Git URL     : ${git_url}` );
		toolkit.log( `	Branch      : ${branch}` );
		toolkit.log( `	Local Path  : ${local_path}` );
		let status              = await helper.repositoryClone( git_url, local_path, branch, AUTO_CREATE_NEW_BRANCH );
		let modified            = [];
		let current_branch      = false;
		let pull_request_branch = false;

		if( status ) {

			if( 'created' !== status ) {
				current_branch      = ( PULL_REQUEST ) ? await toolkit.git.currentBranch( local_path ) : false;
				pull_request_branch = ( PULL_REQUEST ) ? await helper.createPullRequestBranch( local_path, current_branch ) : false;
			}

			let identity_status = await toolkit.git.identity( local_path, require( './variables' ).GIT_USER, require( './variables' ).GIT_EMAIL, true );
			if( identity_status ) {
				await toolkit.asyncForEach( WORKFLOW_FILES, async function( raw_workflow_file ) {
					toolkit.log.cyan( `${raw_workflow_file}` );

					let workflow_file = helper.extract_workflow_file_info( raw_workflow_file );

					if( false === workflow_file ) {
						toolkit.log.error( `Unable To Parse ${raw_workflow_file}`, '	' );
						toolkit.log( '' );
						return;
					}

					let file_data = await helper.source_file_location( WORKFLOW_FILES_DIR, owner, repository, workflow_file.src );

					if( false === file_data ) {
						toolkit.log.error( 'Unable To Find Source File !' );
						toolkit.log( '' );
						return;
					}

					const { source_path, relative_path, dest_type, is_dir } = file_data;

					workflow_file.dest = ( 'workflow' === dest_type ) ? `.github/workflows/${workflow_file.dest}` : workflow_file.dest;

					if( workflow_file.type === 'once' && await toolkit.path.exists( `${local_path}${workflow_file.dest}` ) ) {
						toolkit.log.warn( '	File/Folder Already Exists' );
						toolkit.log( '' );
						return;
					}

					let cp_options    = ( is_dir ) ? { recursive: true, force: true } : {},
						iscopied      = true,
						dest_basepath = toolkit.path.dirname( `${local_path}${workflow_file.dest}` ),
						copy_source   = source_path;

					toolkit.log.success( `${relative_path} => ${workflow_file.dest}`, '	' );

					if( !toolkit.path.exists( dest_basepath ) ) {
						toolkit.log( `Creating ${dest_basepath}`, '	' );
						await io.mkdirP( dest_basepath );
					}

					await io.cp( copy_source, `${local_path}${workflow_file.dest}`, cp_options ).catch( error => {
						toolkit.log.error( 'Unable To Copy File.', '	' );
						toolkit.log( error );
						iscopied = false;
					} ).then( async() => {
						await toolkit.git.add( local_path, `${workflow_file.dest}`, true );

						if( COMMIT_EACH_FILE ) {
							let haschange = await toolkit.git.hasChange( local_path, true );
							if( '' === haschange ) {
								toolkit.log.green( '	No changes detected' );
							} else if( false !== haschange ) {
								await helper.commitfile( local_path, SKIP_CI, COMMIT_MESSAGE );
								modified.push( `${workflow_file.dest}` );
							}
						}
					} );

					toolkit.log( ' ' );
				} );

				if( DRY_RUN ) {
					toolkit.log.warning( 'No Changes Are Pushed' );
					toolkit.log( 'Git Status' );
					toolkit.log( await toolkit.git.stats( local_path ) );
					toolkit.log( ' ' );
				} else {
					let haschange = await toolkit.git.hasChange( local_path, true );
					let log_msg   = ( false === COMMIT_EACH_FILE ) ? 'Git Commit & Push Log' : 'Git Push Log';
					if( '' === haschange && !COMMIT_EACH_FILE ) {
						toolkit.log.success( 'No Changes Are Done :', '	' );
					} else if( false !== haschange && !COMMIT_EACH_FILE ) {
						await helper.commitfile( local_path, SKIP_CI, COMMIT_MESSAGE );
						modified.push( local_path );
					}

					toolkit.log.green( log_msg );
					toolkit.log( '---------------------------------------------------' );
					if( modified.length > 0 ) {
						let pushh_status = await toolkit.git.push( local_path, git_url, false, true );
						if( false !== pushh_status && 'created' !== status && PULL_REQUEST ) {
							// create the pull request
							const pull_request_resp = await finalOctokit.request(`POST /repos/${owner}/${repository}/pulls`, {
								owner: owner, repo: repository,
								title: `Files Sync From ${toolkit.input.env( 'GITHUB_REPOSITORY' )}`,
								head: pull_request_branch,
								base: current_branch
							}).catch((error) => {
								toolkit.log.error(`Error on Pull Request Creation: ${error.status}: ${JSON.stringify(error.response.data)}`);
							});
							if (pull_request_resp) {
								toolkit.log.green( `Pull Request Created : #${pull_request_resp.data.number}` );
								toolkit.log( `${pull_request_resp.data.html_url}` );
							}
						}

					} else {
						toolkit.log.success( 'Nothing To Push' );
					}
					toolkit.log( '---------------------------------------------------' );
				}
			}
		}
		core.endGroup();
		toolkit.log( '' );
	} );
}

run();
