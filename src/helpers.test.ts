import { describe, expect, it } from 'vitest';

import { lineBreakChar } from './helpers';

describe('lineBreakChar', () => {
	it('should return correct charaters', () => {
		expect(lineBreakChar('')).toEqual('');
		expect(lineBreakChar('line')).toEqual('');
		expect(lineBreakChar('line\n')).toEqual('\n');
		expect(lineBreakChar('line\r')).toEqual('\r');
		expect(lineBreakChar('line\r\r')).toEqual('\r');
		expect(lineBreakChar('line\n\n')).toEqual('\n');
		expect(lineBreakChar('line\r\n')).toEqual('\r\n');
		expect(lineBreakChar('line\n\r')).toEqual('\r');
		expect(lineBreakChar('line\nline')).toEqual('\n');
		expect(lineBreakChar('line\rline')).toEqual('\r');
		expect(lineBreakChar('line\r\rline')).toEqual('\r');
		expect(lineBreakChar('line\n\nline')).toEqual('\n');
		expect(lineBreakChar('line\r\nline')).toEqual('\r\n');
		expect(lineBreakChar('line\n\rline')).toEqual('\r');
		expect(lineBreakChar('line\rline\nline')).toEqual('\n');
		expect(lineBreakChar('line\nline\rline')).toEqual('\r');
		expect(lineBreakChar('line\rline\nline\r')).toEqual('\r');
		expect(lineBreakChar('line\nline\rline\n')).toEqual('\n');
	});
});
