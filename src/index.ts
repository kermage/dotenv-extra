import { find, parse, read, write } from './core';

import type { PathLike } from 'fs';

export default class {
	#file: PathLike;
	lbChar: string;
	lines: string[];
	newLine: boolean;

	constructor(file: PathLike, encoding: BufferEncoding = 'utf8') {
		const output = read(file, encoding);
		this.lbChar = output.lbChar;
		this.lines = output.lines;
		this.newLine = '' === this.lines[this.lines.length - 1];
		this.#file = file;
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
		if (this.newLine) {
			this.lines.push('');
		}

		write(this.#file, this.lines, this.lbChar);
	}
}
