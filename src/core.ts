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
	/**
	 * 1. Escape regex special characters in the key (like $ or .)
	 * so they are treated as literal text instead of "superpowers".
	 */
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	/**
	 * 2. Create patterns:
	 * uncommentedRegex: Starts with key, any amount of spaces, then '=' (e.g. "KEY=", "KEY =", " KEY =")
	 * commentedRegex: Starts with #, any amount of spaces, the key, any amount of spaces, then '=' (e.g. "#KEY=", "#KEY =", " # KEY =")
	 */
	const uncommentedRegex = new RegExp(`^\\s*${escapedKey}\\s*=`);
	const commentedRegex = new RegExp(`^\\s*#\\s*${escapedKey}\\s*=`);

	/**
	 * 3. Prioritize active (uncommented) lines first.
	 * This ensures we don't accidentally update a commented-out version
	 * if a live one already exists.
	 */
	const uncommentedLine = lines.find((line) => uncommentedRegex.test(line));
	if (uncommentedLine) {
		return uncommentedLine;
	}

	/**
	 * 4. Fallback: If no active line is found, look for a commented-out version.
	 * This allows the upsert method to "reactivate" a setting.
	 */
	return lines.find((line) => commentedRegex.test(line));
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
			let value = valueParts.join('=').trim();

			// Strip inline comments
			const commentMatch = value.match(/(.*?)\s+#/);
			if (commentMatch) {
				value = commentMatch[1].trim();
			} else if (value.startsWith('#')) {
				value = '';
			}

			// Strip quotes
			if (
				value.length >= 2 &&
				((value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'")))
			) {
				value = value.slice(1, -1);
			}

			if (key) {
				return { ...acc, [key.trim()]: value };
			}

			return acc;
		},
		{} as Record<string, string>,
	);
}
