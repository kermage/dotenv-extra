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
});

describe('parse', () => {
	it('should return a key-value pair', () => {
		expect(parse(arrayVariable)).toEqual(keyValuePairs);
	});
});
