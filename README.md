<p align="center"><img src="https://cdn.svarun.dev/gh/actions-small.png" width="150px"/></p>

# Github Workflow Sync - ***Github Action***
Github Action To Sync Github Action's Workflow Files Across Repositories 

![https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/action-banner.jpg](https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/action-banner.jpg)

## Use Case 🤔 ?
_This Github Action can come in handy when you have lot of projects like i do._
_where in some case certain projects users action workflow which are common across projects._
_Example : [Project 1][project1] & [Project 2][project2] it can be pain to keep all the workflow updated with Github Action's Module's version._

This also isn't limited to Github Action yaml files - another use case could be keeping the `.editorconfig`, `LICENSE`, `tsconfig.json`, `tslint.json`, `.gitignore`, etc. in sync across all your repositories.

>_Here where this action comes in and reduces your stress 😉 it can update all your repository actions file based on the config provided_ 

## ⚙️ Configuration

| **Argument** | Defaults | Description |
| --- | :---: | :---: | 
| `GITHUB_TOKEN` | - | **Required** Token to use to get repos and write secrets. `${{secrets.GITHUB_TOKEN}}` will not work. instead **Personal Access Token Required*** |
| `GIT_URL` | github.com | URL for the instance of github, where repositories should be searched for. Change if using a GHES instance. |
| `REPOSITORIES` | - | **Required** New line deliminated regex expressions to select repositories. Repositires are limited to those in whcich the token user is an owner or collaborator. |
| `WORKFLOW_FILES` | - | **Required** New line deliminated regex expressions. workflow files to be copied to provided repositores |
| `DRY_RUN` | ***false*** | Run everything except for nothing will be pushed. |
| `WORKFLOW_FILES_DIR` | ***workflows*** | Local Path Where Common Workflow Files Are Located ***Eg : `workflows`*** |
| `AUTO_CREATE_NEW_BRANCH` | ***false*** | Auto create new brach in a repository if the branch dose not exists |
| `COMMIT_EACH_FILE` | ***false*** | if you need to keep track of each file's commit history separate then set it to true |
| `PULL_REQUEST` | **false** | Set to `true` if you want the changes to be pushed via pull request. |
| `SKIP_CI` | **false** | Set to `true` if you want skip all automations inside target repository. |
| `COMMIT_MESSAGE` | **false** | You can provide your custom commit message. |
| `RETRY_MODE` | **true** | Enable retry and throttling octokit plugins to avoid secondary rate limits on github content creation. |

### Personal Access Token Scope
#### [Github Personal Token](https://github.com/settings/tokens/new?description=gh-workflow-sync)  <small> Is required with the below scope </small>

![https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/scope.jpg](https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/scope.jpg)

> ℹ️ Full ***Repo*** is only required when you need to update private repository
> if your are updating only public repository then just select `public_repo` inside ***repo*** scope

***[Click Here To Generate A Token](https://github.com/settings/tokens/new?description=gh-workflow-sync)***

---

### `REPOSITORIES` Configuration Examples
<details><summary><strong>Repository With Default Brach</strong></summary>

```yaml
REPOSITORIES: |
    username/repo
    username/repo2
```

</details>

<details><summary><strong>Repositry With Custom Branch</strong></summary>

```yaml
REPOSITORIES: |
    username/repo@dev
    username/repo1@dev2
```
> You Can also have same repository multiple times if you provide different branch name
</details>

---

### `WORKFLOW_FILES` Configuration Examples

1. If you use `=` as a file seperator `file1.md=myfile.md` then `file1` from the current repository will be copied to remote repository with the name of `myfile.md`
1. If you use `!=` as a file seperator `file1.md!=myfile.md` then `file1` from the current repository will be copied to remote repository with the name of `myfile.md` only if `myfile.md` already not exists in the remote repository

<details><summary><strong>Files - Source & Destination File Without Custom Name</strong></summary>

```yaml
WORKFLOW_FILES: |
    dependabot.yml
    .github/settings.yml
```
> **dependabot.yml** will save in root folder in the repository
>
> **.github/settings.yml** will save in `.github` in the repository

</details>

<details><summary><strong>Files - Source File In Root & Destination File In Custom Location</strong></summary>

```yaml
WORKFLOW_FILES: |
    hello-bot.yml=.github/
    pr-bot.yml=.github/pull-request.yml
```
> **hello-bot.yml** will save in `.github` in the repository with the same name
>
> **pr-bot.yml** will save in `.github` in the repository with the name `pull-request.yml`
</details>

<details><summary><strong>Folders - Source & Destination Folders Without Custom Name</strong></summary>

```yaml
WORKFLOW_FILES: |
    folder1
    .github/folder2
```
> **folder1** will save in root folder in the repository
>
> **.github/folder2** will save in `.github` in the repository

</details>

<details><summary><strong>Folders - Source & Destination Folders With Custom Name</strong></summary>

```yaml
WORKFLOW_FILES: |
    folder1=./save-to-folder
    .github/folder2=custom-folder/save-to-folder2
```
> **folder1** will save inside `REPOSITORY ROOT` in the name of `save-to-folder`
>
> **.github/folder2** will save inside `custom-folder` in the name of `save-to-folder2`

</details>

---

## How Files Sync Work ?
Before copying the **WORKFLOW_FILES** from the source to destination. this action will provide some flexibility.
this searchs for a file in various locations for example lets take `settings.yml` as the file that you want to sync for multiple repository

#### Below are the locations that this action search for the file/folder
* `./{OWNER}/{REPO_NAME}/workflows/{filename}`
* `./{OWNER}/workflows/{filename}`
* `./{WORKFLOW_FILES_DIR}/{filename}`
* `./.github/workflows/{filename}`
* `./{OWNER}/{REPO_NAME}/{filename}`
* `./{OWNER}/{filename}`
* `./{filename}`

> if the `settings.yml` is found inside `workflows` folder then the destination is automaitcally forced to `.github/workflows` in the destination repo
>
> if the `settings.yml` is outside of `workflows` folder then the destination then its copied to the destination

### How this can be useful ?
Lets assume that you want to maintain all the common github files in a single repository and suddenly a repository needs a single file to be changed in that case instead of editing the action yml file. you can just create a folder like `{REPO_OWNER}/{REPO_NAME}/{FILE}` to copy the overriden file to the destination


## 🚀 Usage

### Step 1
Create a [New Repository](https://github.com/new) or use our [Repository Template](https://github.com/varunsridharan/template-github-workflow-sync/generate) 

### Step 2
if you have used our template repository then edit the file inside `.github/workflows/workflow-sync.yml`

OR

Create a new file in `.github/workflows/` named **workflow-sync.yml** and copy & paste the below file content

#### `workflow-sync.yml` content
```yaml
name: Workflow Sync

on:
  push:
    branches:
      - master
env:
  DRY_RUN: false
  REPOSITORIES: |
  
  WORKFLOW_FILES: |

jobs:
  Github_Workflow_Sync:
    runs-on: ubuntu-latest
    steps:
      - name: Fetching Local Repository
        uses: actions/checkout@master
      - name: Running Workflow Sync
        uses: varunsridharan/action-github-workflow-sync@main
        with:
          DRY_RUN: ${{ env.DRY_RUN }}
          REPOSITORIES: ${{ env.REPOSITORIES }}
          WORKFLOW_FILES: ${{ env.WORKFLOW_FILES }}
          GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}

```

## Troubleshooting

### Spacing
Spacing around the equal sign is important. For example, this will not work:

```yaml
WORKFLOW_FILES: |
  folder/file-sync.yml = folder/test.txt
```

It passes to the shell file 3 distinct objects

* folder/file-sync.ymll
* =
* folder/test.txt

instead of 1 object

* folder/file-sync.yml = folder/test.txt

and there is nothing I can do in code to make up for that

### Slashes

You do not need (nor want) leading `/` for the file path on either side of the equal sign

The only time you need `/` trailing is for folder copies. 
While a file copy will technically still work with a leading `/`, a folder copy will not

---

## 📝 Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Checkout CHANGELOG.md](/CHANGELOG.md)

## 🤝 Contributing
If you would like to help, please take a look at the list of [issues](issues/).

## 💰 Sponsor
[I][twitter] fell in love with open-source in 2013 and there has been no looking back since! You can read more about me [here][website].
If you, or your company, use any of my projects or like what I’m doing, kindly consider backing me. I'm in this for the long run.

- ☕ How about we get to know each other over coffee? Buy me a cup for just [**$9.99**][buymeacoffee]
- ☕️☕️ How about buying me just 2 cups of coffee each month? You can do that for as little as [**$9.99**][buymeacoffee]
- 🔰         We love bettering open-source projects. Support 1-hour of open-source maintenance for [**$24.99 one-time?**][paypal]
- 🚀         Love open-source tools? Me too! How about supporting one hour of open-source development for just [**$49.99 one-time ?**][paypal]

## 📝 License & Conduct
- [**MIT license**](LICENSE) © [Varun Sridharan](website)


## 📣 Feedback
- ⭐ This repository if this project helped you! :wink:
- Create An [🔧 Issue](issues/) if you need help / found a bug

## Connect & Say 👋
- **Follow** me on [👨‍💻 Github][github] and stay updated on free and open-source software
- **Follow** me on [🐦 Twitter][twitter] to get updates on my latest open source projects
- **Message** me on [📠 Telegram][telegram]
- **Follow** my pet on [Instagram][sofythelabrador] for some _dog-tastic_ updates!

---

<p align="center">
<i>Built With ♥ By <a href="https://go.svarun.dev/twitter"  target="_blank" rel="noopener noreferrer">Varun Sridharan</a> 🇮🇳 </i>
</p>

---

<!-- Personl Links -->
[project1]: https://github.com/varunsridharan/wc-product-subtitle/blob/master/.github/workflows/push-to-master.yml
[project2]: https://github.com/varunsridharan/sku-shortlink-for-woocommerce/blob/master/.github/workflows/push-to-master.yml
[paypal]: https://go.svarun.dev/paypal
[buymeacoffee]: https://go.svarun.dev/buymeacoffee
[sofythelabrador]: https://www.instagram.com/sofythelabrador/
[github]: https://go.svarun.dev/github/
[twitter]: https://go.svarun.dev/twitter/
[telegram]: https://go.svarun.dev/telegram/
[email]: https://go.svarun.dev/contact/email/
[website]: https://go.svarun.dev/website/
