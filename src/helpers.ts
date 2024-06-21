export function lineBreakChar(content: string): string {
	const indexOfLineFeed = content.lastIndexOf('\n');
	const indexOfCarriageReturn = content.lastIndexOf('\r');

	if (indexOfLineFeed > indexOfCarriageReturn) {
		if (indexOfLineFeed === indexOfCarriageReturn + 1) {
			return '\r\n';
		}

		return '\n';
	}

	return indexOfCarriageReturn >= 0 ? '\r' : '';
}
