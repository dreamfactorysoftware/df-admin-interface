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

## Adding additional languages

When more than one language is supported, the language selector will be displayed in the top right corner of the application.

- User language will be detected from preference provided by browser. If browser preference is a supported language it will be selected by default.
- If language selector is enabled and user change language manually, their preference is stored in `localStorage` for future reference. If language preference is found in `localStorage`, than it is treated as default language.

### Adding a New Language

To add a new language, follow these steps:

1. **Add language configuration**  
   Add a new entry to the `SUPPORTED_LANGUAGES` array in [src/lib/constants/languages.ts](src/lib/constants/languages.ts):
   ```typescript
   export const SUPPORTED_LANGUAGES = [
     { code: 'en', altCode: 'en-US', label: 'English' },
     { code: 'es', altCode: 'es-ES', label: 'Español' },
     // Add your new language here
   ] as const
   ```

2. **Create translation files**  
   Create new translation files in [src/assets/i18n](./src/assets/i18n/) and every sub-folder:
   - Base language file: `src/assets/i18n/[lang-code].json`
   - Component-specific files: `src/assets/i18n/[component]/[lang-code].json`

3. **Update language labels**  
   Ensure language labels are available in all supported languages in [src/assets/i18n/en.json](src/assets/i18n/en.json):
   ```json
   {
     "languages": {
       "en": "English",
       "es": "Español"
     }
   }
   ```

4. **Update Next.js i18n configuration**  
   Add the new locale to `next.config.js` if using Next.js internationalization:
   ```javascript
   module.exports = {
     i18n: {
       locales: ['en', 'es'], // Add your new locale
       defaultLocale: 'en',
     },
   }
   ```

### Internationalization Hook Usage

```tsx
// Example usage in React components
import { useTranslation } from '@/hooks/useTranslation'

export function DatabaseConnectionForm() {
  const { t } = useTranslation('database')
  
  return (
    <form>
      <label>{t('connection.host.label')}</label>
      <input placeholder={t('connection.host.placeholder')} />
    </form>
  )
}
```
