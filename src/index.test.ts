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
});
