export function lineBreakChar(content: string): string {
	const lastChar = content[content.length - 1];
	const secondLastChar = content[content.length - 2];

	if (
		lastChar === '\r' ||
		secondLastChar !== '\r' ||
		secondLastChar === lastChar
	) {
		return lastChar;
	}

	return '\r\n';
}
