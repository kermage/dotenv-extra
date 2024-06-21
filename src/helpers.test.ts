import { describe, expect, it } from 'vitest';

import { lineBreakChar } from './helpers';

describe('lineBreakChar', () => {
	it('should return correct charaters', () => {
		expect(lineBreakChar('line\n')).toEqual('\n');
		expect(lineBreakChar('line\r')).toEqual('\r');
		expect(lineBreakChar('line\r\r')).toEqual('\r');
		expect(lineBreakChar('line\n\n')).toEqual('\n');
		expect(lineBreakChar('line\r\n')).toEqual('\r\n');
		expect(lineBreakChar('line\n\r')).toEqual('\r');
	});
});
