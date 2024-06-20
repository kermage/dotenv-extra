# dotenv-extra

## Usage

```ts
import DotEnv from 'dotenv-extra';

const dotEnv = new DotEnv('path-to-file');

dotEnv.upsert('key', 'value');
dotEnv.dump();
dotEnv.save();
```

## License

MIT
