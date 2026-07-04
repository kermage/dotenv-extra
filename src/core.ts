import { readFileSync, writeFileSync } from 'node:fs';
import { countTerminalBackslashes, lineBreakChar } from './helpers';

import type { PathLike } from 'node:fs';

export function read(file: PathLike, encoding: BufferEncoding = 'utf8') {
	const content = readFileSync(file, encoding);
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
	 * 3. Prioritize active (uncommented) lines first, and pick the last
	 * one when duplicates exist so the most recently written entry wins.
	 * Warn when duplicates are found, since this usually indicates
	 * accidental repetition in the file.
	 */
	const activeMatches = lines.filter((line) => uncommentedRegex.test(line));
	if (activeMatches.length > 1) {
		console.warn('dotenv-extra: duplicate entries for key "%s"', key);
	}

	const uncommentedLine = activeMatches[activeMatches.length - 1];
	if (uncommentedLine) {
		return uncommentedLine;
	}

	/**
	 * 4. Fallback: If no active line is found, look for a commented-out version.
	 * This allows the upsert method to "reactivate" a setting. Pick the
	 * last commented match for the same duplicate-policy reason.
	 */
	return lines.findLast((line) => commentedRegex.test(line));
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

			const keyLine = trimmedLine.startsWith('export ')
				? trimmedLine.slice(7)
				: trimmedLine;
			const [key, ...valueParts] = keyLine.split('=');
			let value = valueParts.join('=').trim();

			const quote = value[0];
			if (quote === '"' || quote === "'") {
				let closingIndex = -1;
				for (let i = 1; i < value.length; i++) {
					if (value[i] !== quote) {
						continue;
					}

					let backslashes = 0;
					for (let j = i - 1; j >= 0 && value[j] === '\\'; j--) {
						backslashes++;
					}
					const remainder = value.slice(i + 1).trim();
					const closesValue =
						remainder === '' || remainder.startsWith('#');

					if (closesValue && backslashes % 2 === 0) {
						closingIndex = i;
						break;
					}
				}

				if (closingIndex !== -1) {
					const quotedValue = value.slice(1, closingIndex);
					const terminalBackslashCount =
						countTerminalBackslashes(quotedValue);
					value = terminalBackslashCount
						? quotedValue.slice(
								0,
								quotedValue.length - terminalBackslashCount,
							) + '\\'.repeat(terminalBackslashCount / 2)
						: quotedValue;
				}
			} else {
				const commentMatch = value.match(/(.*?)\s+#/);
				if (commentMatch) {
					value = commentMatch[1].trim();
				} else if (value.startsWith('#')) {
					value = '';
				}
			}

			if (key) {
				return { ...acc, [key.trim()]: value };
			}

			return acc;
		},
		{} as Record<string, string>,
	);
}
