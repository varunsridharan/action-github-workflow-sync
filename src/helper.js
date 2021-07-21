const exec    = require( '@actions/exec' );
const toolkit = require( 'actions-js-toolkit' );

const repositoryDetails = ( input_repo ) => {
	let GIT_TOKEN = require( './variables' ).GITHUB_TOKEN;
	let GIT_URL   = require( './variables' ).GIT_URL;
	let WORKSPACE = require( './variables' ).WORKSPACE;
	input_repo    = input_repo.split( '@' );

	// Extract Branch Info varunsridharan/demo@master
	let branch = ( typeof input_repo[ 1 ] !== 'undefined' ) ? input_repo[ 1 ] : false;
	branch     = ( false === branch || '' === branch ) ? 'default' : branch;
	input_repo = input_repo[ 0 ].split( '/' );

	return {
		owner: input_repo[ 0 ],
		repository: input_repo[ 1 ],
		git_url: `https://x-access-token:${GIT_TOKEN}@${GIT_URL}/${input_repo[ 0 ]}/${input_repo[ 1 ]}.git`,
		branch,
		local_path: `${WORKSPACE}${input_repo[ 0 ]}/${input_repo[ 1 ]}/${branch}/`
	};
};

const repositoryClone = async( git_url, local_path, branch, auto_create_branch ) => {
	const common_arg = '--quiet --no-hardlinks --no-tags';
	const options    = { silent: false };
	let status       = true;
	if( 'default' === branch ) {
		await exec.exec( `git clone ${common_arg} --depth 1 ${git_url} "${local_path}"`, [], options )
				  .then( () => toolkit.log.success( 'Repository Cloned', '	' ) )
				  .catch( () => {
					  toolkit.log.error( 'Unable to Clone Repository!', '	' );
					  status = false;
				  } );
	} else {
		await exec.exec( `git clone ${common_arg} --depth 1 --branch "${branch}" ${git_url} "${local_path}"`, [], options )
				  .then( () => toolkit.log.success( `Repository Branch ${branch} Cloned`, '	' ) )
				  .catch( async() => {
					  if( false !== auto_create_branch ) {
						  toolkit.log.warn( 'Branch Not found', '	' );
						  await exec.exec( `git clone ${common_arg} ${git_url} "${local_path}"`, [], options )
									.then( async() => {
										await toolkit.exec( `git checkout -b ${branch}`, local_path )
													 .then( () => {
														 toolkit.log.success( 'Repository Cloned', '	' );
														 toolkit.log.success( 'Branch Created', '	' );
														 status = 'created';
													 } )
													 .catch( () => {
														 toolkit.log.error( 'Unable To Create Branch.', '	' );
														 status = false;
													 } );
									} )
									.catch( () => {
										toolkit.log.error( 'Repository Dose Not Exists !', '	' );
										status = false;
									} );
					  } else {
						  toolkit.log.error( `Repository Branch ${branch} Not Found!`, '	' );
						  status = false;
					  }
				  } );
	}
	return status;
};

const extract_workflow_file_info = ( file ) => {
	const regex = /([\s\S]*?)(\!=|=)([\s\S].+|)/;
	const m     = regex.exec( file );

	/**
	 * M Example Array
	 * 0 -- Full
	 * 1 -- Src File
	 * 2 -- Operator
	 * 3 -- Dest File
	 */
	if( null !== m ) {
		if( '' !== m[ 1 ] ) {
			let src          = m[ 1 ],
				operator     = m[ 2 ],
				dest         = m[ 3 ];
			let $r           = { src: src.trim(), type: ( '!=' === operator ) ? 'once' : 'copy' };
			$r.dest          = ( '' !== dest ) ? dest.trim() : $r.src;
			$r.src           = toolkit.path.fix( $r.src );
			$r.dest          = toolkit.path.fix( $r.dest );
			$r.src_filename  = toolkit.path.basename( $r.src );
			$r.dest_filename = toolkit.path.basename( $r.dest );
			return $r;
		}
		return false;
	}
	file = toolkit.path.fix( file );
	return {
		src: file,
		dest: file,
		type: 'copy',
		src_filename: toolkit.path.basename( file ),
		dest_filename: toolkit.path.basename( file )
	};
};

const source_file_location = async( WORKFLOW_FILES_DIR, REPOSITORY_OWNER, REPOSITORY_NAME, SRC_FILE ) => {
	let GITHUB_WORKSPACE = require( './variables' ).GITHUB_WORKSPACE,
		workflows_files  = [
			`${REPOSITORY_OWNER}/${REPOSITORY_NAME}/workflows/${SRC_FILE}`,
			`${REPOSITORY_OWNER}/workflows/${SRC_FILE}`,
			`${WORKFLOW_FILES_DIR}/${SRC_FILE}`,
			`.github/workflows/${SRC_FILE}`,
		],
		general_files    = [
			`${REPOSITORY_OWNER}/${REPOSITORY_NAME}/${SRC_FILE}`,
			`${REPOSITORY_OWNER}/${SRC_FILE}`,
			`${SRC_FILE}`
		];
	let _return          = false;
	await toolkit.asyncForEach( workflows_files, async( LOCATION ) => {
		if( toolkit.path.exists( `${GITHUB_WORKSPACE}/${LOCATION}` ) && false === _return ) {
			_return = {
				source_path: `${GITHUB_WORKSPACE}/${LOCATION}`,
				relative_path: `${LOCATION}`,
				dest_type: 'workflow',
				is_dir: await toolkit.path.isDir( `${GITHUB_WORKSPACE}/${LOCATION}` ),
			};
		}
	} );

	if( false === _return ) {
		await toolkit.asyncForEach( general_files, async( LOCATION ) => {
			if( toolkit.path.exists( `${GITHUB_WORKSPACE}/${LOCATION}` ) && false === _return ) {
				_return = {
					source_path: `${GITHUB_WORKSPACE}/${LOCATION}`,
					relative_path: `${LOCATION}`,
					dest_type: false,
					is_dir: await toolkit.path.isDir( `${GITHUB_WORKSPACE}/${LOCATION}` ),
				};
			}
		} );
	}

	return _return;
};

const commitfile = async( local_path, skip_ci, commit_message ) => {
	let message = `💬 - Files Synced | Runner ID : ${toolkit.input.env( 'GITHUB_RUN_NUMBER' )} | ⚡ Triggered By ${toolkit.input.env( 'GITHUB_REPOSITORY' )}`;

	if( ( typeof commit_message === 'undefined' || commit_message === 'false' || commit_message === false ) && skip_ci ) {
		message = '[skip ci] | ' + message;
	}

	if( typeof commit_message === 'string' && ( commit_message !== 'false' && commit_message !== 'true' ) ) {
		message = commit_message;
	}

	return await toolkit.git.commit( local_path, message );
};

const createPullRequestBranch = async( work_dir, current_branch ) => {
	let timestamp       = Math.round( ( new Date() ).getTime() / 1000 );
	let new_branch_name = `file-sync-${toolkit.input.env( 'GITHUB_RUN_NUMBER' )}-${current_branch}-${timestamp}`;
	let status          = true;
	await toolkit.exec( `git checkout -b ${new_branch_name}`, work_dir ).then( () => {
		toolkit.log.success( `Pull Request Branch "${new_branch_name}" Created From ${current_branch}`, '	' );
	} ).catch( () => status = false );
	return ( true === status ) ? new_branch_name : false;
};

module.exports = {
	createPullRequestBranch: createPullRequestBranch,
	commitfile: commitfile,
	repositoryDetails: repositoryDetails,
	repositoryClone: repositoryClone,
	source_file_location: source_file_location,
	extract_workflow_file_info: extract_workflow_file_info,
};
