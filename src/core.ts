import { readFileSync, writeFileSync } from 'fs';

import type { PathLike } from 'fs';

export function read(file: PathLike) {
	return readFileSync(file, 'utf8').toString().split('\n');
}

export function write(file: PathLike, lines: string[]) {
	writeFileSync(file, lines.join('\n'), 'utf8');
}

export function find(key: string, lines: string[]) {
	return lines.find((line) => {
		return line.match(`^(#\\s)?${key}\\s?=`);
	});
}

export function parse(lines: string[]) {
	return lines.reduce(
		(acc, line) => {
			if (!line) {
				return acc;
			}

			const [key, value] = line.split('=', 2);

			return { ...acc, [key.trim()]: value.trim() };
		},
		{} as Record<string, string>,
	);
}
