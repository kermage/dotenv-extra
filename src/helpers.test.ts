import { describe, expect, it } from 'vitest';

import { lineBreakChar, printLineBreakChar, quoteIfNeeded } from './helpers';

describe('lineBreakChar', () => {
	it('should return correct characters', () => {
		expect(lineBreakChar('')).toEqual('');
		expect(lineBreakChar('line')).toEqual('');
		expect(lineBreakChar('\n')).toEqual('\n');
		expect(lineBreakChar('\r')).toEqual('\r');
		expect(lineBreakChar('\r\r')).toEqual('\r');
		expect(lineBreakChar('\n\n')).toEqual('\n');
		expect(lineBreakChar('\n\r')).toEqual('\r');
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

describe('printLineBreakChar', () => {
	it('should print LF as an escape sequence', () => {
		expect(printLineBreakChar('\n')).toBe('\\n');
	});

	it('should print CR as an escape sequence', () => {
		expect(printLineBreakChar('\r')).toBe('\\r');
	});

	it('should print CRLF as an escape sequence', () => {
		expect(printLineBreakChar('\r\n')).toBe('\\r\\n');
	});

	it('should print any other value as none', () => {
		expect(printLineBreakChar('')).toBe('(none)');
	});
});

describe('quoteIfNeeded', () => {
	it('should leave plain values alone', () => {
		expect(quoteIfNeeded('bar')).toBe('bar');
		expect(quoteIfNeeded('a#b')).toBe('a#b');
		expect(quoteIfNeeded('')).toBe('');
	});

	it('should double-quote values needing protection', () => {
		expect(quoteIfNeeded('a b # c')).toBe('"a b # c"');
		expect(quoteIfNeeded('  padded  ')).toBe('"  padded  "');
		expect(quoteIfNeeded('#leading')).toBe('"#leading"');
	});

	it('should double-quote terminal backslash values needing protection', () => {
		expect(quoteIfNeeded('a # b\\')).toBe('"a # b\\\\"');
	});

	it('should double longer runs of terminal backslashes', () => {
		expect(quoteIfNeeded('a # b\\\\\\')).toBe('"a # b\\\\\\\\\\\\"');
		expect(quoteIfNeeded('a # b\\\\\\\\')).toBe('"a # b\\\\\\\\\\\\\\\\"');
	});

	it('should not blow up on a long backslash run followed by trailing whitespace', () => {
		const start = performance.now();
		const value = `${'\\'.repeat(100000)} `;

		expect(quoteIfNeeded(value)).toBe(`"${value}"`);
		expect(performance.now() - start).toBeLessThan(500);
	});

	it('should fall back to single quotes around double quotes', () => {
		expect(quoteIfNeeded('say "hi" # now')).toBe('\'say "hi" # now\'');
	});

	it('should throw when value contains both quote characters', () => {
		expect(() => quoteIfNeeded('say "hi" it\'s # done')).toThrow(TypeError);
		expect(() => quoteIfNeeded('say "hi" it\'s # done')).toThrow(
			'Value requires quoting but contains both quote characters',
		);
	});

	it('wraps a double-quoted value in single quotes', () => {
		expect(quoteIfNeeded('"q"')).toBe(`'"q"'`);
	});

	it('wraps a single-quoted value in double quotes', () => {
		expect(quoteIfNeeded("''")).toBe(`"''"`);
	});

	it('still throws when both quote characters are present', () => {
		expect(() => quoteIfNeeded(`"'`)).toThrow(TypeError);
	});
});
