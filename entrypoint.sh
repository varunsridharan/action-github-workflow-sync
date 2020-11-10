#!/bin/bash
set -e
BASE_DIR=$(dirname "$(dirname $GITHUB_WORKSPACE)")
wget https://raw.githubusercontent.com/varunsridharan/actions-toolkit/main/setup-toolkit.sh >/dev/null 2>&1
chmod uga+x setup-toolkit.sh
sh setup-toolkit.sh "${BASE_DIR}/toolkit/" >/dev/null 2>&1
rm -rf setup-toolkit.sh

source "${BASE_DIR}/toolkit/shell.sh"

# Validate Input Vars
gh_validate_input "GITHUB_TOKEN" "Github Personal Access Token Is Required To Run This Action !"
gh_validate_input "REPOSITORIES" "REPOSITORIES List is required"
gh_validate_input "WORKFLOW_FILES" "WORKFLOW_FILES List is required"

# Configure Github Details
gh_log
#git config --system core.longpaths true
git config --global core.longpaths true

# Make Temp Work Directory
TEMP_PATH="${BASE_DIR}/workflow-sync/"
mkdir -p "$TEMP_PATH"

# Fetch Input Vars
RAW_REPOSITORIES=$(gh_input "REPOSITORIES")
RAW_WORKFLOW_FILES=$(gh_input "WORKFLOW_FILES")
DRY_RUN="$(gh_input "DRY_RUN" false)"
GH_TOKEN="$(gh_input "GITHUB_TOKEN")"
AUTO_CREATE_NEW_BRANCH="$(gh_input "AUTO_CREATE_NEW_BRANCH")"
WORKFLOW_FILES_DIR="$(gh_input "WORKFLOW_FILES_DIR")"
COMMIT_EACH_FILE="$(gh_input "COMMIT_EACH_FILE")"

# Convert String Into Array
REPOSITORIES=($RAW_REPOSITORIES)
WORKFLOW_FILES=($RAW_WORKFLOW_FILES)

# Display Basic Information
gh_log " "
gh_log "⚙️ Basic Config"
gh_log "-------------------------------------------------------"
gh_log "  * DRY_RUN               : $DRY_RUN"
gh_log "  * Total Repositories    : ${#REPOSITORIES[@]}"
gh_log "  * Total Workflow Files  : ${#WORKFLOW_FILES[@]}"
gh_log "--------------------------------------------------------"
gh_log " "

# Loop All Repository
for R in "${REPOSITORIES[@]}"; do
  gh_log_group_start "📓  ${R}"
  cd "${TEMP_PATH}"
  # Basic Repository Config
  REPO_DATA=($(echo ${R} | tr "@" "\n"))
  REPOSITORY_ID_DATA=($(echo ${REPO_DATA[0]} | tr "/" "\n"))
  REPOSITORY_OWNER="${REPOSITORY_ID_DATA[0]}"
  REPOSITORY_ID="${REPOSITORY_OWNER}/${REPOSITORY_ID_DATA[1]}"
  IS_BRANCH_CREATED=false
  BRANCH="$(is_empty_var "${REPO_DATA[1]}" "default")"
  GIT_PATH="${TEMP_PATH}${REPOSITORY_ID}/${BRANCH}"
  GIT_URL="https://x-access-token:${GH_TOKEN}@github.com/${REPOSITORY_ID}.git"

  # Log Basic Config Info
  gh_log "$(log_purple "⚙️ Repository Config")"
  gh_log "  Slug          : ${REPOSITORY_ID}"
  gh_log "  Branch        : ${BRANCH}"
  gh_log "  Url           : ${GIT_URL}"
  gh_log "  Local Path    : ${GIT_PATH}"
  gh_log

  if [ "$BRANCH" != "default" ]; then
    (git clone --quiet --no-hardlinks --no-tags --branch "${BRANCH}" --depth 1 $GIT_URL $GIT_PATH >/dev/null 2>&1) || echo "Failed" >/dev/null 2>&1

    if [ ! -d "$GIT_PATH" ]; then
      if [ "$AUTO_CREATE_NEW_BRANCH" = true ]; then
        #gh_log "$(log_yellow "${BRANCH} Not Found !")"
        git clone --quiet --no-hardlinks --no-tags $GIT_URL $GIT_PATH >/dev/null 2>&1
        cd "$GIT_PATH"
        git checkout -b $BRANCH >/dev/null 2>&1
        gh_log "$(log_blue "✔️  ${BRANCH} Branch Created")"
        IS_BRANCH_CREATED=true
      fi
    fi
  else
    git clone --quiet --no-hardlinks --no-tags --depth 1 $GIT_URL "${GIT_PATH}"
  fi

  if [ -d "$GIT_PATH" ]; then
    if [ "$BRANCH" != "default" ]; then
      gh_log "$(log_green "✔️  Repositry Branch ${BRANCH} Cloned")"
    else
      gh_log "$(log_green "✔️  Repository Cloned")"
    fi
  else
    if [ "$BRANCH" != "default" ]; then
      gh_log_error "${BRANCH} Dose Not Exists. Failed To Sync Files !"
    else
      gh_log_error "Repository Dose Not Exists. Failed To Sync Files !"
    fi
    exit
  fi

  gh_log
  cd "$GIT_PATH"
  gitconfiglocal "Github Actions Workflow Sync Bot" "githubactionbot+workflowsync@gmail.com"
  if [ "$IS_BRANCH_CREATED" = false ]; then
    git pull >/dev/null 2>&1
  fi

  # Loop All Workflow Files
  for FILE in "${WORKFLOW_FILES[@]}"; do
    WORKFLOW_FILE=($(echo $FILE | tr "=" "\n"))
    SRC_FILE=${WORKFLOW_FILE[0]}
    SRC_FILE_NAME=$(basename "$SRC_FILE")
    SRC_FULL_PATH=""
    SRC_RELATIVE_PATH=""
    #SRC_FILE_EXT="${SRC_FILE_NAME##*.}"
    DEST_FILE=""
    DEST_FILE_TYPE='general'

    gh_log "$(log_cyan "${SRC_FILE}")"

    #if [ "${SRC_FILE_EXT}" != "" ]; then
    # 1. Location : repo-owner/repo-id/workflows/src-file
    # 2. Location : repo-owner/workflows/src-file
    # 3. Location : common-workflow-dir/src-file
    # 4. Location : .github/workflows/src-file
    # 5. Location : repo-owner/repo-id/src-file
    # 6. Location : repo-owner/src-file
    # 7. Location : src-file

    if [ -f "${GITHUB_WORKSPACE}/${REPOSITORY_ID}/workflows/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${REPOSITORY_ID}/workflows/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${REPOSITORY_ID}/workflows/${SRC_FILE}"
      DEST_FILE_TYPE='workflow'
    elif [ -f "${GITHUB_WORKSPACE}/${REPOSITORY_OWNER}/workflows/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${REPOSITORY_OWNER}/workflows/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${REPOSITORY_OWNER}/workflows/${SRC_FILE}"
      DEST_FILE_TYPE='workflow'
    elif [ -f "${GITHUB_WORKSPACE}/${WORKFLOW_FILES_DIR}/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${WORKFLOW_FILES_DIR}/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${WORKFLOW_FILES_DIR}/${SRC_FILE}"
      DEST_FILE_TYPE='workflow'
    elif [ -f "$GITHUB_WORKSPACE/.github/workflows/$SRC_FILE" ] || [ -d "$GITHUB_WORKSPACE/.github/workflows/$SRC_FILE" ]; then
      SRC_RELATIVE_PATH=".github/workflows/$SRC_FILE"
      DEST_FILE_TYPE='workflow'
    elif [ -f "${GITHUB_WORKSPACE}/${REPOSITORY_ID}/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${REPOSITORY_ID}/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${REPOSITORY_ID}/${SRC_FILE}"
    elif [ -f "${GITHUB_WORKSPACE}/${REPOSITORY_OWNER}/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${REPOSITORY_OWNER}/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${REPOSITORY_OWNER}/${SRC_FILE}"
    elif [ -f "${GITHUB_WORKSPACE}/${SRC_FILE}" ] || [ -d "${GITHUB_WORKSPACE}/${SRC_FILE}" ]; then
      SRC_RELATIVE_PATH="${SRC_FILE}"
    else
      gh_log_error "${SRC_FILE} Not Found !"
      SRC_RELATIVE_PATH=""
      gh_log
    fi

    # Proceed To Copy & Commit Only If Source File / Folder Exists
    if [ "$SRC_RELATIVE_PATH" != "" ]; then
      # Checks if Custom Dest Path is given
      if [ ${WORKFLOW_FILE[1]+yes} ]; then
        if [ "${DEST_FILE_TYPE}" = "workflow" ]; then
          DEST_FILE=".github/workflows/${WORKFLOW_FILE[1]}"
        else
          DEST_FILE="${WORKFLOW_FILE[1]}"
        fi
      else
        if [ "${DEST_FILE_TYPE}" = "workflow" ]; then
          DEST_FILE=".github/workflows/${SRC_FILE}"
        else
          DEST_FILE="${SRC_FILE}"
        fi
      fi

      SRC_FULL_PATH="${GITHUB_WORKSPACE}/${SRC_RELATIVE_PATH}"

      gh_log "  ${SRC_RELATIVE_PATH} => ${DEST_FILE}"

      DEST_FOLDER_PATH=$(dirname "${GIT_PATH}/${DEST_FILE}")

      if [ ! -d "$DEST_FOLDER_PATH" ]; then
        gh_log "  Creating [$DEST_FOLDER_PATH]"
        mkdir -p $DEST_FOLDER_PATH
      fi

      # Checks if current src is a dir if yes then copy files based on it.
      if [ -d "${SRC_FULL_PATH}" ]; then
        if [ ! -d "${GIT_PATH}/${DEST_FILE}" ]; then
          mkdir -p "${GIT_PATH}/${DEST_FILE}"
        fi
        cp -rf "${SRC_FULL_PATH}/." "${GIT_PATH}/${DEST_FILE}"
      else
        cp -rf "${SRC_FULL_PATH}" "${GIT_PATH}/${DEST_FILE}"
      fi

      git add "${GIT_PATH}/${DEST_FILE}" -f
      if [ "$COMMIT_EACH_FILE" = true ]; then
        if [ "$(git status --porcelain)" != "" ]; then
          git commit -m "💬 - Files Synced | Github Action Runner : ${GITHUB_RUN_NUMBER} | ⚡ Triggered By ${GITHUB_REPOSITORY}@${GITHUB_SHA}"
        else
          gh_log "  ✅ No Changes Are Done : ${SRC_FILE}"
        fi
      fi
    fi
  done

  if [ -z "$DRY_RUN" ]; then
    gh_log_warning "No Changes Are Pushed"
    gh_log
    gh_log "Git Status"
    git status
    gh_log
  elif [ "$DRY_RUN" = true ]; then
    gh_log_warning "No Changes Are Pushed"
    gh_log
    gh_log "Git Status"
    git status
    gh_log
  else
    gh_log
    if [ "$COMMIT_EACH_FILE" = false ]; then
      gh_log "$(log_green "Git Commit & Push Log")"
    else
      gh_log "$(log_green "Git Push Log")"
    fi
    gh_log "---------------------------------------------------"
    if [ "$COMMIT_EACH_FILE" = false ]; then
      if [ "$(git status --porcelain)" != "" ]; then
        git commit -m "💬 - Files Synced | Github Action Runner : ${GITHUB_RUN_NUMBER} | ⚡ Triggered By ${GITHUB_REPOSITORY}@${GITHUB_SHA}"
      else
        gh_log " ✅ No Files Changed"
      fi
    fi
    git push $GIT_URL
    gh_log "---------------------------------------------------"
    gh_log
  fi

  gh_log_group_end
  cd "${TEMP_PATH}"
  rm -rf "${GIT_PATH}"
done

rm -rf "${TEMP_PATH}"