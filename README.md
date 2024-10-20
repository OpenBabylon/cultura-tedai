# CulturaAI Monorepo

## VSCode

### Extensions

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Installation

First go into `web_app` folder containing the all web_app project.

```
cd web_app
```


### 1. Dependencies.

`pnpm i`

### 2. Environment Variables

#### 2.1 Api Server

1. Copy file `apps/api-server/.env.sample` into `apps/api-server/.env`
2. Edit configuration in `.env`

#### 2.2 Front end

1. Copy file `apps/frontend/.env.sample` into `apps/frontend/.env`
2. Edit configuration in `.env`

## Usage

- `pnpm dev:api-server` Launch api server in dev mode.
- `pnpm dev:frontend` Launch frontend server in dev mode.
- `pnpm pkg:build` Build internal packages.

## Package structure

The repository root contains auxiliary files like `package.json`, `.gitignore`, etc.

- `apps`: applications sources.
- `packages`: shared packages.

### apps/api-server/src

API Server to handle requests from front-end application.

- `lib`: configured libraries ready to usage.
- `models`: mongoose schemas. https://mongoosejs.com/docs/guide.html
- `routes`: api server route handlers.
- `scripts`: standalone scripts for execution.
- `services`: standalone services with business logic.
- `main.ts`: entry point and api server configuration.

### apps/frontend/src

Frontend application.

- `assets`: images, icons, etc...
- `components`: global components that ready to use without `import`.
- `composables`: reusable logic. https://vuejs.org/guide/reusability/composables
- `layouts`: page layouts.
- `pages`: file based routing. https://uvr.esm.is/
- `router`: vue-router configuration files.
- `stores`: pinia storage instances. https://pinia.vuejs.org/

### packages/\*

Shared packages. After source modification you need to re-build it `pnpm pkg:build`

## Deploy

### Production

Push commits to `main` branch.

## Commit style guide

The following is a list of commit types used in the angular preset:

- **feat:** Commits that result in new features or functionalities. Backwards compatible features will release with the next MINOR whereas breaking changes will be in the next MAJOR. The body of a commit with breaking changes must begin with BREAKING CHANGE, followed by a description of how the API has changed.
- **fix:** Commits that provide fixes for bugs within codebase.
- **docs:** Commits that provide updates to the docs.
- **style:** Commits that do not affect how the code runs, these are simply changes to formatting.
- **lang:** Commits that provide updates of language or fix typos.
- **refactor:** Commits that neither fixes a bug nor adds a feature.
- **perf:** Commits that improve performance.
- **test:** Commits that add missing or correct existing tests.
- **chore:** Other commits that don’t modify src or test files.
- **revert:** Commits that revert previous commits.

# Author

- Andrew L. (andrew.io.dev@gmail.com)
