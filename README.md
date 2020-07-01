<p align="center"><img src="https://cdn.svarun.dev/gh/actions-small.png" width="150px"/></p>

# Github Workflow Sync - ***Github Action***
Github Action To Sync Github Action's Workflow Files Across Repositories 

![https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/action-banner.jpg](https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/action-banner.jpg)

## Use Case 🤔 ?
_This Github Action can come in handy when you have lot of projects like i do._
_where in some case certain projects users action workflow which are common across projects._
_Example : [Project 1][project1] & [Project 2][project2] it can be pain to keep all the workflow updated with Github Action's Module's version._

>_Here where this action comes in and reduces your stress 😉 it can update all your repository actions file based on the config provided_ 

## ⚙️ Configuration

| **Argument** | Description |
| --- | :---: | 
| `github_token` | **Required** Token to use to get repos and write secrets. `${{secrets.GITHUB_TOKEN}}` will not work. instead **Personal Access Token Required*** |
| `repositories` | **Required** New line deliminated regex expressions to select repositories. Repositires are limited to those in whcich the token user is an owner or collaborator. |
| `workflow_files` | **Required** New line deliminated regex expressions. workflow files to be copied to provided repositores |
| `dry_run` | Run everything except for nothing will be pushed. |

### Personal Access Token Scope
#### [Github Personal Token](https://github.com/settings/tokens/new?description=gh-workflow-sync)  <small> Is required with the below scope </small>

![https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/scope.jpg](https://cdn.svarun.dev/gh/varunsridharan/action-github-workflow-sync/scope.jpg)

> ℹ️ Full ***Repo*** is only required when you need to update private repository
> if your are updating only public repository then just select `public_repo` inside ***repo*** scope

***[Click Here To Generate A Token](https://github.com/settings/tokens/new?description=gh-workflow-sync)***

### `workflow_files`
**Example** 
```yaml
WORKFLOW_FILES: |
    your-workflow-file1.yml
    your-workflow-file2.yml
```

**Example | Custom File Location** 
```yaml
WORKFLOW_FILES: |
    ./your-folder/your-workflow-file1.yml
    ./your-folder/your-workflow-file2.yml
```

**Example | Custom File Name** 
Action will locate `your-workflow-file1.yml` from in your repository where this action is used & `your-custom-workflow-file.yml` will be the new file name which will be used to store in the repository you provided
```yaml
WORKFLOW_FILES: |
    ./your-folder/your-workflow-file1.yml=your-custom-workflow-file.yml
```

---

## 🚀 Usage

### Step 1
Create a [New Repository](https://github.com/new) or use our [Repository Template](https://github.com/varunsridharan/template-github-workflow-sync/generate) 

### Step 2
if you have used our template repository then edit the file inside `.github/workflows/workflow-sync.yml`

OR

Create a new file in `.github/workflows/` named ***workflow-sync.yml** and copy & paste the below file content

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
        uses: varunsridharan/action-github-workflow-sync@master
        with:
          DRY_RUN: ${{ env.DRY_RUN }}
          REPOSITORIES: ${{ env.REPOSITORIES }}
          WORKFLOW_FILES: ${{ env.WORKFLOW_FILES }}
          GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}

```
---

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
- [**General Public License v3.0 license**](LICENSE) © [Varun Sridharan](website)
- [Code of Conduct](code-of-conduct.md)

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