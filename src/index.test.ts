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
});
