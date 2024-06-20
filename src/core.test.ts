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
	it('should return an array of lines', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue(multilineString);
		expect(read(dotEnvFile)).toEqual(arrayVariable);
	});
});

describe('write', () => {
	it('should write a multi-lined file', () => {
		vi.spyOn(fs, 'writeFileSync').mockImplementation((_, data) =>
			expect(data).toEqual(multilineString),
		);
		write(dotEnvFile, arrayVariable);
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
