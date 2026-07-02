# gitignoreSoC

`.gitignore`ファイルを分割管理し、自動結合とGit追跡のクリーンアップを行うCLIツールです。 / A CLI tool for separating concerns in `.gitignore` files, featuring automated merging and Git tracking cleanup.

![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green?style=flat-square&logo=node.js&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow?style=flat-square&logo=javascript&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033?style=flat-square&logo=git&logoColor=white)

[日本語](#日本語) | [English](#english)

## 日本語

> [!NOTE]
> 本ツールは、`.gitignore`において一度すべてのファイルを対象外（`*`）にした上で、必要なファイルやフォルダのみを例外（`!`）として許可する「ホワイトリスト方式」で管理したいユーザー向けに設計されています。

### 概要
gitignoreSoC（コマンド名: `mushi`）は、1つのファイルに肥大化しがちな `.gitignore` の設定を、機能やディレクトリごとに分割して管理（関心の分離）するためのCLIツールです。また、`.gitignore` を更新した際に、すでにGitの追跡対象になってしまっているファイルが自動で反映されないという仕様上の問題を、インデックスの自動クリーンアップ機能によって解決します。

### 特徴
* **関心の分離（SoC）**: `.gitignores/` ディレクトリ配下に `{役割名}.gitignore` として設定を分割して配置することで、可読性と保守性を向上させます。サブディレクトリを作って階層的に整理することも可能です。
* **Git追跡の自動クリーンアップ**: 新しいルールによって無視対象となった既存の追跡ファイルを `git check-ignore` で自動抽出し、インデックスから安全に除外（`git rm --cached`）します。
* **安全な検証モード**: `--dry-run` オプションを使用することで、実際のファイル書き込みや追跡解除を行う前に、変更される差分と対象ファイルの一覧をコンソール上で事前に確認できます。
* **競合防止のためのファイル命名**: 分割ファイルの拡張子を `{名前}.gitignore` とすることで、ルートのGitが意図しない挙動を起こすのを防ぎ、人間やAIにとっても役割が理解しやすくなります。

### インストール方法
以下のコマンドを実行し、グローバル環境にインストールしてください。
```bash
npm install -g DovahkiinYuzuko/gitignoreSoC
```

### 使用方法

#### 1. 初期化
プロジェクトのルートディレクトリで以下のコマンドを実行します。
```bash
mushi init
```
`.gitignores/` ディレクトリが作成され、ルートにホワイトリスト方式のベースとなる `.gitignore` テンプレートが生成されます（既に `.gitignore` が存在する場合は上書きされません）。

#### 2. 設定ファイルの分割配置
`.gitignores/` ディレクトリ配下に、任意のファイル名で分割した設定ファイル（例: `src.gitignore`, `tests.gitignore`）を作成し、例外許可したいルールを記述します。

#### 3. 事前確認（ドライラン）
実際の変更を行う前に、以下のコマンドで適応される差分とクリーンアップ対象のファイルを確認できます。
```bash
mushi --dry-run
```

#### 4. 結合とクリーンアップの実行
オプションなしでコマンドを実行すると、分割された設定がルートの `.gitignore` に自動結合され、同時に追跡のクリーンアップが実行されます。
```bash
mushi
```

#### 5. 分割ファイルの一覧表示
現在 `.gitignores/` 配下に存在する設定ファイルの一覧と、それぞれの行数を確認できます。
```bash
mushi --list
```

### LICENSE
このプロジェクトのライセンスはMITです。詳しくは[LICENSE](LICENSE)をお読みください。

---

## English

> [!NOTE]
> This tool is specifically designed for users who prefer to manage their `.gitignore` using a "whitelist approach," where all files are ignored by default (`*`) and only specific files or folders are allowed as exceptions (`!`).

### Overview
`gitignoreSoC` (Command name: `mushi`) is a CLI tool designed to separate concerns in `.gitignore` configurations by dividing them into smaller, manageable files based on features or directories. It also solves a common Git limitation where newly added `.gitignore` rules do not automatically apply to files that are already being tracked, by providing an automated index cleanup feature.

### Features
* **Separation of Concerns (SoC)**: Enhances readability and maintainability by allowing you to split configurations into `{role}.gitignore` files under the `.gitignores/` directory. Fragment files can also be nested in subdirectories for further organization.
* **Automated Git Tracking Cleanup**: Automatically identifies tracked files that should now be ignored under the new rules using `git check-ignore`, and safely removes them from the index (`git rm --cached`).
* **Safe Verification Mode**: By using the `--dry-run` option, you can preview the changes to be made and the list of affected files in the console before any actual file writes or untracking occur.
* **Conflict-Preventing Naming Convention**: Naming the fragment files as `{name}.gitignore` prevents the root Git repository from reacting unexpectedly to them, while remaining easily understandable for both humans and AI.

### Installation
Run the following command to install the tool globally:
```bash
npm install -g DovahkiinYuzuko/gitignoreSoC
```

### Usage

#### 1. Initialization
Run the following command in your project's root directory:
```bash
mushi init
```
This creates the `.gitignores/` directory and generates a base `.gitignore` template optimized for the whitelist approach at the root (existing `.gitignore` files will not be overwritten).

#### 2. Creating Configuration Fragments
Create separated configuration files (e.g., `src.gitignore`, `tests.gitignore`) under the `.gitignores/` directory with arbitrary names, and describe the rules you want to allow as exceptions.

#### 3. Previewing Changes (Dry-Run)
Before applying actual changes, you can verify the diffs and the files to be cleaned up by running:
```bash
mushi --dry-run
```

#### 4. Execution of Merge and Cleanup
Running the command without any options automatically merges the split configurations into the root `.gitignore` and executes the tracking cleanup simultaneously.
```bash
mushi
```

#### 5. Listing Configuration Fragments
You can display a list of the configuration files currently existing under `.gitignores/` along with their respective line counts by running:
```bash
mushi --list
```

### LICENSE
This project is licensed under the MIT License. Please read the [LICENSE](LICENSE) file for details.