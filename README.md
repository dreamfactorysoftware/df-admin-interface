# DreamFactory Admin Interface

Admin interface for managing DreamFactory instance.

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
