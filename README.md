# dotenv-extra

> _"Gracefully handle .env files"_

## Usage

```ts
import DotEnv from 'dotenv-extra';

const dotEnv = new DotEnv('path-to-file');

dotEnv.upsert('key', 'value');
dotEnv.dump();
dotEnv.save();
```

### CLI

`dotenv-extra [<key> <value>...]`

## License

MIT
