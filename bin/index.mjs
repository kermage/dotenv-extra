#!/usr/bin/env node

import { accessSync, constants } from 'fs';
import { createRequire } from 'module';
import DotEnv from '../dist/index.mjs';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const usage = `\nUsage: ${pkg.name} [<key> <value>...]\n`;
const args = process.argv.slice(2);

if (args.length === 0) {
	process.stdout.write(`${pkg.description}\n`);
	process.stdout.write(usage);
	process.exit(0);
}

if (args.length % 2 !== 0) {
	process.stderr.write('Must provide key-value pairs\n');
	process.stderr.write(usage);
	process.exit(1);
}

const file = '.env';

try {
	accessSync(file, constants.W_OK);
} catch (err) {
	const message =
		err.code === 'ENOENT'
			? 'does not exist in CWD'
			: 'in CWD is not writable';

	process.stderr.write(`${file} ${message}\n`);
	process.stderr.write(usage);
	process.exit(1);
}

const dotenv = new DotEnv(file);

for (let i = 0; i < args.length; i += 2) {
	dotenv.upsert(args[i], args[i + 1]);
}

dotenv.save();
