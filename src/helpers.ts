export function lineBreakChar(content: string): string {
	const counts: [string, number][] = [
		['\r\n', (content.match(/\r\n/g) ?? []).length],
		['\n', (content.match(/(?<!\r)\n/g) ?? []).length],
		['\r', (content.match(/\r(?!\n)/g) ?? []).length],
	];

	const nonZero = counts.filter(([, count]) => count > 0);
	if (nonZero.length > 1) {
		const detail = nonZero
			.map(([seq, c]) => `${c} ${printLineBreakChar(seq)}`)
			.join(', ');
		throw new Error(
			`Mixed line endings detected (${detail}). Normalize the file before editing.`,
		);
	}

	if (nonZero.length === 1) {
		return nonZero[0][0];
	}

	return '';
}

export function printLineBreakChar(lbChar: string): string {
	switch (lbChar) {
		case '\n':
			return '\\n';
		case '\r':
			return '\\r';
		case '\r\n':
			return '\\r\\n';
		default:
			return '(none)';
	}
}

/** Count consecutive backslashes at the end of a string. */
export function countTerminalBackslashes(value: string): number {
	let count = 0;
	while (value[value.length - 1 - count] === '\\') {
		count++;
	}
	return count;
}

/** Wrap value in quotes if it contains inline-comment triggers. */
export function quoteIfNeeded(value: string): string {
	const needsQuotes =
		/^\s|\s$/.test(value) ||
		/\s#/.test(value) ||
		value.startsWith('#') ||
		value.startsWith('"') ||
		value.startsWith("'");

	if (!needsQuotes) {
		return value;
	}
	const terminalBackslashCount = countTerminalBackslashes(value);
	const quotedValue = terminalBackslashCount
		? value.slice(0, value.length - terminalBackslashCount) +
			'\\'.repeat(terminalBackslashCount * 2)
		: value;

	if (!value.includes('"')) {
		return `"${quotedValue}"`;
	}

	if (!value.includes("'")) {
		return `'${quotedValue}'`;
	}

	throw new TypeError(
		'Value requires quoting but contains both quote characters',
	);
}
