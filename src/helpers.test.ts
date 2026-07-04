import { describe, expect, it } from 'vitest';

import { lineBreakChar, printLineBreakChar, quoteIfNeeded } from './helpers';

describe('lineBreakChar', () => {
	it('should return empty string for no line breaks', () => {
		expect(lineBreakChar('')).toBe('');
		expect(lineBreakChar('line')).toBe('');
	});

	it('should detect pure LF', () => {
		expect(lineBreakChar('a=1\nb=2\n')).toBe('\n');
	});

	it('should detect pure CRLF', () => {
		expect(lineBreakChar('a=1\r\nb=2\r\n')).toBe('\r\n');
	});

	it('should detect pure CR', () => {
		expect(lineBreakChar('a=1\rb=2\r')).toBe('\r');
	});

	it('should throw on mixed LF and CRLF', () => {
		expect(() => lineBreakChar('a=1\r\nb=2\n')).toThrow(
			/Mixed line endings detected/,
		);
	});

	it('should throw on mixed CR and LF', () => {
		expect(() => lineBreakChar('a=1\nb=2\r')).toThrow(
			/Mixed line endings detected/,
		);
	});

	it('should throw on mixed CR and CRLF', () => {
		expect(() => lineBreakChar('a=1\r\nb=2\r')).toThrow(
			/Mixed line endings detected/,
		);
	});

	it('should not confuse CRLF with separate CR and LF', () => {
		expect(lineBreakChar('a=1\r\nb=2\r\nc=3\r\n')).toBe('\r\n');
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
