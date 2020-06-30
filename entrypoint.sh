#!/bin/bash
set -eu

RAW_REPOSITORIES="$INPUT_REPOSITORIES"
RAW_WORKFLOW_FILES="$INPUT_WORKFLOW_FILES"
GITHUB_TOKEN="$INPUT_GITHUB_TOKEN"
DRY_RUN="$INPUT_DRY_RUN"
REPOSITORIES=($RAW_REPOSITORIES)
WORKFLOW_FILES=($RAW_WORKFLOW_FILES)
TEMP_PATH="/gh/"
cd /
echo " "
echo "⚙️ Basic Setup"
echo "DRY_RUN: $DRY_RUN"
git config --system core.longpaths true
git config --global core.longpaths true
git config --global user.email "githubactionbot+workflowsync@gmail.com" && git config --global user.name "GH Actions Workflow Sync Bot"
mkdir "$TEMP_PATH"
cd "$TEMP_PATH"
echo " "

# Loops All Provided Repos
for R in "${REPOSITORIES[@]}"; do
  echo "###[group] 📓  $R"

  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${R}.git"
  GIT_PATH="${TEMP_PATH}${R}"
  LOCAL_PATH="${GIT_PATH}/.github/workflows/"
  DEST_STATUS="Updated"
  echo "Git URL : $REPO_URL"
  echo "Clone Path : $GIT_PATH"
  git clone --quiet --no-hardlinks --no-tags --depth 1 $REPO_URL ${R}
  echo " "

  if [ ! -d "$LOCAL_PATH" ]; then
    mkdir -p $LOCAL_PATH
    DEST_STATUS="Created"
  else
    DEST_STATUS="Updated"
  fi

  cd $GIT_PATH
  # Loops All Provided Workflows
  for WOF in "${WORKFLOW_FILES[@]}"; do
    WORKFLOW_FILE=($(echo $WOF | tr "=" "\n"))
    SRC_FILE=${WORKFLOW_FILE[0]}
    DEST_FILE=""
    SRC_FULL_PATH=""
    SRC_FILE_NAME=$(basename "$SRC_FILE")
    SRC_FILE_EXT="${SRC_FILE_NAME##*.}"

    if [ "$SRC_FILE_EXT" != "yml" ]; then
      echo "⚠️ ${SRC_FILE} Is Not A Valid Github Actions Workflow File"
    else
      if [ ${WORKFLOW_FILE[1]+yes} ]; then
        DEST_FILE="${WORKFLOW_FILE[1]}"
      fi

      if [ -f "$GITHUB_WORKSPACE/.github/workflows/$SRC_FILE" ]; then
        SRC_FULL_PATH="${GITHUB_WORKSPACE}/.github/workflows/${SRC_FILE}"
      elif [ -f "${GITHUB_WORKSPACE}/${SRC_FILE}" ]; then
        SRC_FULL_PATH="${GITHUB_WORKSPACE}/${SRC_FILE}"
      fi

      if [ "$SRC_FULL_PATH" != "" ]; then
        cp "$SRC_FULL_PATH" "${LOCAL_PATH}${DEST_FILE}"

        if [ "$(git status --porcelain)" != "" ]; then
          git add "${LOCAL_PATH}${DEST_FILE}" -f
          git commit -m "💬 #${GITHUB_RUN_NUMBER} - Workflow File ${DEST_STATUS} / ⚡ Triggered By ${GITHUB_REPOSITORY}@${GITHUB_SHA}"
        else
          echo "✅ Nothing Changed For Workflow : ${SRC_FILE}"
        fi
      else
        echo "🛑 ${SRC_FILE} Not Found In ${GITHUB_REPOSITORY}
        Searched In Below Locations
        1. $GITHUB_WORKSPACE/.github/workflows/$SRC_FILE
        2. ${GITHUB_WORKSPACE}/${SRC_FILE}
        "
      fi
    fi

    echo " "
  done

  if [ -z "$DRY_RUN" ]; then
    echo "⚠️ No changes will be pushed to ${R}"
    git status
  elif [ "$DRY_RUN" = true ]; then
    echo "⚠️ No changes will be pushed to ${R}"
    git status
  else
    git push $REPO_URL
  fi
  echo "###[endgroup]"
  cd $TEMP_PATH
done
