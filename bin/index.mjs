#!/usr/bin/env node

import DotEnv from '../dist/index.mjs';

const args = process.argv.slice(2);
const dotenv = new DotEnv('.env');

for (let i = 0; i < args.length; i += 2) {
	dotenv.upsert(args[i], args[i + 1]);
}

dotenv.save();
