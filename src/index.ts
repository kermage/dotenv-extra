import { find, parse, read, write } from './core';

import type { PathLike } from 'fs';

export default class {
	#file: PathLike;
	lines: string[];

	constructor(file: PathLike) {
		this.#file = file;
		this.lines = read(file);
	}

	upsert(key: string, value: string) {
		const item = `${key}=${value}`;
		const line = find(key, this.lines);

		if (line) {
			this.lines.splice(this.lines.indexOf(line), 1, item);
		} else {
			this.lines.push(item);
		}
	}

	dump() {
		return parse(this.lines);
	}

	save() {
		write(this.#file, this.lines);
	}
}
