# dotenv-extra

> _"Gracefully handle `.env` files."_

## Usage

### API

```bash
npm install dotenv-extra
```

```ts
import DotEnv from 'dotenv-extra';

// Load a specific .env file
const dotEnv = new DotEnv('path-to-file');

// Update or insert an entry
dotEnv.upsert('key', 'value');

// Get the current entries as an object
const entries = dotEnv.dump();

console.log(entries);
// { key: 'value', ... }

// Save the changes back to the file
dotEnv.save();
```

### CLI

```bash
npx dotenv-extra [<key> <value>...]
```

* Expects a `.env` file to be present and writable.
* File creation is intentionally not implemented.

2-liner example of quickly setting up a project:

```bash
cp .env.example .env

npx dotenv-extra APP_KEY 12345 APP_ENV production MAINTENANCE true
```
