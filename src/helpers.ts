export function lineBreakChar(content: string): string {
	const indexOfLineFeed = content.lastIndexOf('\n');
	const indexOfCarriageReturn = content.lastIndexOf('\r');

	if (indexOfLineFeed > indexOfCarriageReturn) {
		if (
			indexOfCarriageReturn > -1 &&
			indexOfLineFeed === indexOfCarriageReturn + 1
		) {
			return '\r\n';
		}

		return '\n';
	}

	return indexOfCarriageReturn >= 0 ? '\r' : '';
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
