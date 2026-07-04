import * as fs from 'fs';
import { describe, expect, it, vi } from 'vitest';
import mainEntry from './index';

import { dotEnvFile, keyValuePairs, multilineString } from '../tests/constants';

vi.mock('fs');

describe('main entry', () => {
	it('should return an array of lines', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue(multilineString);

		const mObj = new mainEntry(dotEnvFile);

		expect(mObj.dump()).toEqual(keyValuePairs);
		mObj.upsert('key4', 'val4');
		expect(mObj.dump()).toEqual({ ...keyValuePairs, key4: 'val4' });
		mObj.upsert('key5', 'val5');
		mObj.upsert('key6', 'val6');
		expect(mObj.dump()).toEqual({
			...keyValuePairs,
			key4: 'val4',
			key5: 'val5',
			key6: 'val6',
		});
	});

	it('should append empty new line', () => {
		const lbChar = '\n';
		const baseContent = multilineString + lbChar;
		const appendedKeyValue = ['last', 'line'] as const;
		const newLine = appendedKeyValue.join('=');
		const newContent = [baseContent, newLine].join(lbChar);

		vi.spyOn(fs, 'readFileSync').mockReturnValue(baseContent);
		vi.spyOn(fs, 'writeFileSync').mockImplementation((_, data) =>
			expect(data).toEqual(newContent + lbChar),
		);

		const mObj = new mainEntry(dotEnvFile);

		expect(mObj.dump()).toEqual(keyValuePairs);
		mObj.upsert(...appendedKeyValue);
		mObj.save();
	});

	it('should return false when save fails', () => {
		const mObj = new mainEntry(dotEnvFile);

		mObj.upsert('key', 'value').upsert('foo', 'bar');
		expect(mObj.upsert('baz', 'qux').save()).toBe(false);
	});

	it('should not mutate lines array when saving with trailing newline', () => {
		const lbChar = '\n';
		const baseContent = multilineString + lbChar;

		vi.spyOn(fs, 'readFileSync').mockReturnValue(baseContent);
		vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

		const mObj = new mainEntry(dotEnvFile);

		expect(mObj.lines.length).toBe(3);
		mObj.save();
		expect(mObj.lines.length).toBe(3);
		mObj.save();
		expect(mObj.lines.length).toBe(3);
	});

	it('should reject keys or values containing line breaks', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		expect(() => dotenv.upsert('KEY', 'a\nEVIL=pwned')).toThrow(TypeError);
		expect(() => dotenv.upsert('KEY', 'a\rEVIL=pwned')).toThrow(TypeError);
		expect(() => dotenv.upsert('BAD\nKEY', 'x')).toThrow(TypeError);
	});

	it('should reject empty keys', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		expect(() => dotenv.upsert('', 'value')).toThrow(TypeError);
	});

	it('should reject keys containing equals', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		expect(() => dotenv.upsert('A=B', 'value')).toThrow(TypeError);
	});

	it('should reject keys that start with export prefix syntax', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		expect(() => dotenv.upsert('export FOO', 'x')).toThrow(TypeError);
	});

	it('should round-trip values that need quoting', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		dotenv.upsert('MSG', 'hello # world');
		expect(dotenv.dump().MSG).toBe('hello # world');
	});

	it('should round-trip quoted values ending in backslash', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		dotenv.upsert('MSG', 'hello # world\\');
		expect(dotenv.dump().MSG).toBe('hello # world\\');
	});

	it('should round-trip terminal backslash values containing single quotes', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('A=1\n');
		const dotenv = new mainEntry(dotEnvFile);
		dotenv.upsert('MSG', "it's # here\\");
		expect(dotenv.dump().MSG).toBe("it's # here\\");
	});

	it('should update the occurrence that dump reads', () => {
		vi.spyOn(fs, 'readFileSync').mockReturnValue('FOO=bar\nFOO=old\n');
		const dotenv = new mainEntry(dotEnvFile);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		dotenv.upsert('FOO', 'new');
		expect(dotenv.dump().FOO).toBe('new');
		expect(dotenv.lines).toEqual(['FOO=bar', 'FOO=new']);
	});
});
