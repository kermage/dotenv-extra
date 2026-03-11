import { readFileSync, writeFileSync } from 'fs';
import { lineBreakChar } from './helpers';

import type { PathLike } from 'fs';

export function read(file: PathLike, encoding: BufferEncoding = 'utf8') {
	const content = readFileSync(file, encoding).toString();
	const lbChar = lineBreakChar(content) || '\n';
	const lines = content ? content.split(lbChar) : [];

	return { content, lbChar, lines };
}

export function write(
	file: PathLike,
	lines: string[],
	lbChar: string = '\n',
	encoding: BufferEncoding = 'utf8',
) {
	writeFileSync(file, lines.join(lbChar), encoding);
}

export function find(key: string, lines: string[]) {
	return lines.find((line) => {
		return line.match(`^(#\\s)?${key}\\s?=`);
	});
}

export function parse(lines: string[]) {
	return lines.reduce(
		(acc, line) => {
			const trimmedLine = line.trim();
			if (
				!trimmedLine ||
				trimmedLine.startsWith('#') ||
				!trimmedLine.includes('=')
			) {
				return acc;
			}

			const [key, ...valueParts] = trimmedLine.split('=');
			const value = valueParts.join('=');

			if (key) {
				return { ...acc, [key.trim()]: value.trim() };
			}

			return acc;
		},
		{} as Record<string, string>,
	);
}
