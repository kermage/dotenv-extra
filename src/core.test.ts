import * as fs from 'fs';
import { describe, expect, it, vi } from 'vitest';
import { find, parse, read, write } from './core';

import {
	arrayVariable,
	dotEnvFile,
	keyValuePairs,
	multilineString,
} from '../tests/constants';

vi.mock('fs');

describe('read', () => {
	vi.spyOn(fs, 'readFileSync')
		.mockReturnValueOnce(multilineString)
		.mockReturnValueOnce('');

	const output = read(dotEnvFile);

	it('should return the content of the file', () => {
		expect(output.content).toEqual(multilineString);
	});
	it('should return the line break character', () => {
		expect(output.lbChar).toEqual('\n');
	});
	it('should return the array of lines list', () => {
		expect(output.lines).toEqual(arrayVariable);
	});

	it('should return default lbChar and empty lines', () => {
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
		expect(find('FOO', lines)).toEqual('# FOO=bar');
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
});
