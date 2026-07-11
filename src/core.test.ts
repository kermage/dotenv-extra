import * as fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { find, parse, read, write } from './core';

import {
	arrayVariable,
	dotEnvFile,
	keyValuePairs,
	multilineString,
} from '../tests/constants';

vi.mock('node:fs');

describe('read', () => {
	it('should return the content of the file', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(multilineString);
		const output = read(dotEnvFile);
		expect(output.content).toEqual(multilineString);
	});

	it('should return the line break character', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(multilineString);
		const output = read(dotEnvFile);
		expect(output.lbChar).toEqual('\n');
	});

	it('should return the array of lines list', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(multilineString);
		const output = read(dotEnvFile);
		expect(output.lines).toEqual(arrayVariable);
	});

	it('should return default lbChar and empty lines', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('');
		expect(read(dotEnvFile)).toEqual({
			content: '',
			lbChar: '\n',
			lines: [],
		});
	});
});

describe('write', () => {
	it('should write a multi-lined file', () => {
		vi.spyOn(fs, 'writeFileSync').mockImplementation((_, data) =>
			expect(data).toEqual(multilineString),
		);
		write(dotEnvFile, arrayVariable, '\n');
	});
});

describe('find', () => {
	it('might get the full line of "key"', () => {
		expect(find('unknown', arrayVariable)).toBeUndefined();
		expect(find('key1', arrayVariable)).toBeTypeOf('string');
		expect(find('key2', arrayVariable)).toEqual('key2=val2');
	});

	it('should handle special regex characters in key (literal match)', () => {
		const lines = ['MY.KEY=value', 'MY*KEY=value', 'MY$KEY=value'];
		expect(find('MY.KEY', lines)).toEqual('MY.KEY=value');
		expect(find('MY*KEY', lines)).toEqual('MY*KEY=value');
		expect(find('MY$KEY', lines)).toEqual('MY$KEY=value');
	});

	it('should handle special regex characters in key', () => {
		const lines = ['DB_PASSWORD$=secret', 'KEY.WITH.DOTS=value'];
		expect(find('DB_PASSWORD$', lines)).toEqual('DB_PASSWORD$=secret');
		expect(find('KEY.WITH.DOTS', lines)).toEqual('KEY.WITH.DOTS=value');
	});

	it('should prioritize uncommented lines over commented ones', () => {
		const lines = ['# FOO=bar', 'FOO=baz', '# FOO=qux'];
		expect(find('FOO', lines)).toEqual('FOO=baz');
	});

	it('should return commented line if no uncommented ones exist', () => {
		const lines = ['# FOO=bar', '# FOO=qux'];
		expect(find('FOO', lines)).toEqual('# FOO=qux');
	});

	it('should find the last duplicate occurrence', () => {
		expect(find('FOO', ['FOO=a', 'BAR=b', 'FOO=c'])).toBe('FOO=c');
	});

	it('should find the last commented occurrence when no active exists', () => {
		const lines = ['# FOO=bar', '# FOO=qux'];
		expect(find('FOO', lines)).toEqual('# FOO=qux');
	});

	it('should warn about duplicate active entries', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		find('FOO', ['FOO=a', 'BAR=b', 'FOO=c']);
		expect(spy).toHaveBeenCalledWith(
			'dotenv-extra: duplicate entries for key "%s"',
			'FOO',
		);
		spy.mockRestore();
	});

	it('should not warn when only one active entry exists', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		find('FOO', ['FOO=a', 'BAR=b']);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it('should handle spaces after # in commented lines', () => {
		const lines = ['#FOO=bar', '#   BAR=baz'];
		expect(find('FOO', lines)).toEqual('#FOO=bar');
		expect(find('BAR', lines)).toEqual('#   BAR=baz');
	});

	it('should handle leading spaces', () => {
		const lines = ['  FOO=bar', '\t# BAR=baz'];
		expect(find('FOO', lines)).toEqual('  FOO=bar');
		expect(find('BAR', lines)).toEqual('\t# BAR=baz');
	});

	it('should handle space before = sign', () => {
		const lines = ['FOO =bar', 'BAR  =baz', 'BAZ =  qux'];
		expect(find('FOO', lines)).toEqual('FOO =bar');
		expect(find('BAR', lines)).toEqual('BAR  =baz');
		expect(find('BAZ', lines)).toEqual('BAZ =  qux');
	});

	it('should NOT match keys that just START with the search term', () => {
		const lines = ['DATABASE_URL=localhost', 'DATABASE=test'];
		expect(find('DATABASE', lines)).toEqual('DATABASE=test');
		expect(find('DATA', lines)).toBeUndefined();
	});
});

describe('parse', () => {
	it('should return a key-value pair', () => {
		expect(parse(arrayVariable)).toEqual(keyValuePairs);
	});

	it('should ignore empty lines', () => {
		const lines = ['FOO=bar', '', '   '];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar' });
	});

	it('should ignore commented lines', () => {
		const lines = ['FOO=bar', '# comment line', '  # QUX=quux ', 'BAZ=qux'];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
	});

	it('should ignore invalid lines', () => {
		const lines = ['FOO=bar', '', '   ', 'NO_EQUAL_SIGN', '=VALUE_ONLY'];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar' });
	});

	it('should handle spaces around =', () => {
		const lines = [' FOO = bar ', 'BAZ  =  qux'];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
	});

	it('should handle multiple = signs', () => {
		const lines = [
			'CONNECTION_STRING=mysql://user:pass@host:3306/db?option=1',
		];
		const result = parse(lines);
		expect(result).toEqual({
			CONNECTION_STRING: 'mysql://user:pass@host:3306/db?option=1',
		});
	});

	it('should strip inline comments', () => {
		const lines = ['FOO=bar # comment', 'BAZ=qux  # another comment'];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
	});

	it('should strip quotes from values', () => {
		const lines = ['FOO="bar"', "BAZ='qux'"];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
	});

	it('should preserve quoted prefixes with literal suffixes', () => {
		expect(parse(['A="foo"bar'])).toEqual({ A: '"foo"bar' });
	});

	it('should halve a pair of quoted terminal backslashes', () => {
		expect(parse(['A="two\\\\"'])).toEqual({ A: 'two\\' });
	});

	it('should not blow up on a long backslash run before a literal suffix inside quotes', () => {
		const start = performance.now();
		const line = `A="${'\\'.repeat(100000)}x"`;

		expect(parse([line])).toEqual({ A: `${'\\'.repeat(100000)}x` });
		expect(performance.now() - start).toBeLessThan(500);
	});

	it('should halve longer runs of quoted terminal backslashes', () => {
		expect(parse(['A="six\\\\\\\\\\\\"'])).toEqual({ A: 'six\\\\\\' });
		expect(parse(['A="eight\\\\\\\\\\\\\\\\"'])).toEqual({
			A: 'eight\\\\\\\\',
		});
	});

	it('should preserve an escaped terminal quote without a closing quote', () => {
		expect(parse(['A="two\\"'])).toEqual({ A: '"two\\"' });
	});

	it('should keep hash inside double-quoted values', () => {
		expect(parse(['FOO="abc # def"'])).toEqual({ FOO: 'abc # def' });
	});

	it('should keep hash inside single-quoted values', () => {
		expect(parse(["BAR='it is # here'"])).toEqual({ BAR: 'it is # here' });
	});

	it('should strip inline comments after quoted values', () => {
		expect(parse(['FOO="bar" # comment'])).toEqual({ FOO: 'bar' });
	});

	it('should preserve unterminated quotes verbatim', () => {
		expect(parse(['D="unterminated'])).toEqual({ D: '"unterminated' });
		expect(parse(['E="has # inside'])).toEqual({ E: '"has # inside' });
	});

	it('should locate the outer closing quote past an escaped inner quote', () => {
		expect(parse(["BAR='it\\'s ready'"])).toEqual({ BAR: "it\\'s ready" });
		expect(parse(['FOO="a\\"b" # comment'])).toEqual({ FOO: 'a\\"b' });
		expect(parse(['FOO="a\\"b" c"'])).toEqual({ FOO: 'a\\"b" c' });
	});

	it('should handle empty quoted values', () => {
		expect(parse(['A=""'])).toEqual({ A: '' });
		expect(parse(["B=''"])).toEqual({ B: '' });
	});

	it('should treat hash-only value as empty', () => {
		expect(parse(['C=#only'])).toEqual({ C: '' });
	});

	it('strips a leading export prefix from the key', () => {
		expect(parse(['export FOO=bar'])).toEqual({ FOO: 'bar' });
		expect(parse(['export KEY=value'])).toEqual({ KEY: 'value' });
	});

	it('skips a bare export line without an equals', () => {
		const lines = ['export', 'FOO=bar'];
		const result = parse(lines);
		expect(result).toEqual({ FOO: 'bar' });
	});

	it('does not recognize backticks as quote characters', () => {
		expect(parse(['A=`bar`'])).toEqual({ A: '`bar`' });
	});

	it('does not treat a hash with no preceding whitespace as a comment', () => {
		expect(parse(['FOO=bar#baz'])).toEqual({ FOO: 'bar#baz' });
	});

	it('lets the last occurrence of a duplicate key win', () => {
		expect(parse(['A=1', 'A=2'])).toEqual({ A: '2' });
	});

	it('parses a bare unquoted empty value', () => {
		expect(parse(['FOO='])).toEqual({ FOO: '' });
	});

	it('keeps an escaped newline as two literal characters', () => {
		expect(parse(['A=foo\\nbar'])).toEqual({ A: 'foo\\nbar' });
	});

	it('does not expand variable references', () => {
		expect(parse(['A=${FOO}'])).toEqual({ A: '${FOO}' });
		expect(parse(['B=$BAR'])).toEqual({ B: '$BAR' });
	});

	it('does not treat a colon as a key-value separator', () => {
		expect(parse(['KEY: value'])).toEqual({});
	});

	it('cannot close a quoted value on a following physical line', () => {
		expect(parse(['A="line1', 'line2"'])).toEqual({ A: '"line1' });
	});
});
