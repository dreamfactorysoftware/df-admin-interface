# DreamFactory Admin Interface

Admin interface for managing DreamFactory instance.

## Overview

DreamFactory is a secure, self-hosted enterprise data access platform that provides governed API access to any data source, connecting enterprise applications and on-prem LLMs with role-based access and identity passthrough.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Development](#development)
  - [Linting and Formatting](#linting-and-formatting)
    - [Lint](#lint)
    - [Lint and Fix](#lint-and-fix)
    - [Format](#format)
- [Running the tests](#running-the-tests)
  - [Run Unit Tests](#run-unit-tests)
  - [Run and Watch Unit Tests](#run-and-watch-unit-tests)
  - [Run Unit Tests with Coverage](#run-unit-tests-with-coverage)
- [Building the Project](#building-the-project)
  - [dist is built by CI](#dist-is-built-by-ci)
- [Adding additional languages](#adding-additional-languages)

## Getting Started

### Prerequisites

- Node.js >=16.14.0
- Angular CLI

### Installation

```
npm install
```

#### Install husky

[husky](https://typicode.github.io/husky/) is used to run git hooks for formatting and linting checking code prior to commiting code. To install husky run the following command:

```
npm run prepare
```

## Usage

### Development

```
npm start
```

Proxying to DreamFactory instance is configured in [proxy.conf.json](./proxy.conf.json).

### Linting and Formatting

#### Lint

```
npm run lint
```

#### Lint and Fix

```
npm run lint:fix
```

#### Format

```
npm run prettier
```

## Running the tests

[jest](https://jestjs.io/) is used for unit testing. Tests are named with the following convention: [name].spec.ts

#### Run Unit Tests

```
npm run test
```

#### Run and Watch Unit Tests

```
npm run test:watch
```

#### Run Unit Tests with Coverage

```
npm run test:coverage
```

## Building the Project

```
npm run build
```

### dist is built by CI

`dist/` is tracked in git because DreamFactory installs this repository as a composer package and serves `dist/` as it is. Nothing builds at install time.

On `develop`, CI is the only writer of `dist/`. After every push to `develop`, the [Build dist](.github/workflows/dist.yml) workflow builds the app with Node 22, checks the output with `scripts/verify-dist.sh`, and commits `dist/` as `github-actions[bot]` if it changed. The bot commit lands a few minutes after the merge. Pull `develop` again after it lands.

Rules for contributors:

- Do not commit `dist/`. Do not push "rebuild dist" commits. The [Guard dist](.github/workflows/guard-dist.yml) check fails on a pull request that changes `dist/`.
- Do not put `[skip ci]` in a commit that goes to `develop`. It stops the build, and `dist/` falls behind the source.

A local `npm run build` writes into the tracked `dist/` directory and renames most files in it. To undo that:

```
git restore --staged --worktree -- dist
git clean -fdq dist
```

To build without touching the tracked directory, send the output somewhere else:

```
npx ng build --output-path /tmp/df-admin-dist
scripts/verify-dist.sh /tmp/df-admin-dist
```

If your branch already has commits that change `dist/`, drop those changes:

```
git fetch origin
git restore --source="origin/develop...HEAD" --staged --worktree -- dist
git commit -m "chore: drop dist changes"
```

If merging `develop` into your branch conflicts in `dist/`, take the copy from `develop` and finish the merge:

```
git rm -rfq dist
git checkout origin/develop -- dist
git commit
```

## Adding additional languages

When more than one language is supported, the language selector will be displayed in the top right corner of the application.

- User language will be detected from preference provided by browser. If browser preference is a supported language it will be selected by default.
- If language selector is enabled and user change language manually, their preference is stored in `localStorage` for future reference. If language preference is found in `localStorage`, than it is treated as default language.

- To add a new language, follow these steps:
  1. Add a new entry to the `SUPPORTED_LANGUAGES` array in [src/app/shared/constants/languages.ts](src/app/shared/constants/languages.ts).
     - code: The language code. This is used to identify the language in the application.
     - altCode: Alternative language code that might be provided by browser. eg en-US, en-CA.
  2. Create new translation files in [src/assets/i18n](./src/assets/i18n/) and every sub-folder.
     - Ensure label for languages are created in alternative language in [src/assets/i18n/en.json](src/assets/i18n/en.json)
       ```json
       "languages": {
         "en": "English"
       }
       ```
     - These are used to display language label in dropdown.
