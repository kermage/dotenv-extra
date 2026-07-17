import {
	copyFileSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import DotEnv from './index';

function roundTrip(fixture: string, edit: (d: DotEnv) => void): string {
	const dir = mkdtempSync(join(tmpdir(), 'dotenv-extra-'));
	try {
		const file = join(dir, '.env');
		copyFileSync(join(__dirname, '../tests/golden', fixture), file);

		const dotenv = new DotEnv(file);
		edit(dotenv);
		expect(dotenv.save()).toBe(true);

		return readFileSync(file, 'utf8');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

function expected(fixture: string): string {
	return readFileSync(
		join(
			__dirname,
			'../tests/golden',
			fixture.replace('.env', '.expected.env'),
		),
		'utf8',
	);
}

describe('golden round-trips', () => {
	it('should reproduce file byte-for-byte on no-op', () => {
		const output = roundTrip('noop.env', () => {});
		expect(output).toBe(expected('noop.env'));
	});

	it('should preserve absence of a trailing newline', () => {
		const output = roundTrip('no-trailing-newline.env', (d) =>
			d.upsert('BAR', 'updated'),
		);
		expect(output).toBe(expected('no-trailing-newline.env'));
		expect(output.endsWith('\n')).toBe(false);
	});

	it('should reactivate a commented entry in place', () => {
		const output = roundTrip('reactivation.env', (d) =>
			d.upsert('FOO', 'new'),
		);
		expect(output).toBe(expected('reactivation.env'));
	});

	it('should preserve CRLF line endings', () => {
		const output = roundTrip('crlf.env', (d) => d.upsert('BAR', 'updated'));
		expect(output).toBe(expected('crlf.env'));
	});

	it('should preserve CR-only line endings', () => {
		const output = roundTrip('cr.env', (d) => d.upsert('BAR', 'updated'));
		expect(output).toBe(expected('cr.env'));
		expect(output).toContain('\r');
		expect(output).not.toContain('\n');
	});

	it('should update the last duplicate and leave others untouched', () => {
		const output = roundTrip('duplicates.env', (d) =>
			d.upsert('FOO', 'new'),
		);
		expect(output).toBe(expected('duplicates.env'));
	});

	it('should preserve comments and blank lines', () => {
		const output = roundTrip('comments.env', (d) =>
			d.upsert('TARGET', 'changed'),
		);
		expect(output).toBe(expected('comments.env'));
	});

	it('should round-trip a value that needs quoting', () => {
		const output = roundTrip('quoting.env', (d) =>
			d.upsert('MSG', ' hello world '),
		);
		expect(output).toBe(expected('quoting.env'));
	});

	it('should round-trip an empty value', () => {
		const output = roundTrip('empty-values.env', (d) =>
			d.upsert('NEW', ''),
		);
		expect(output).toBe(expected('empty-values.env'));
	});

	it('should round-trip a value containing equals signs', () => {
		const output = roundTrip('equals-in-value.env', (d) =>
			d.upsert('URL', 'pg://host/db?opt=1&x=2'),
		);
		expect(output).toBe(expected('equals-in-value.env'));
	});

	it('should update a key with leading/trailing whitespace around it', () => {
		const output = roundTrip('whitespace-key.env', (d) =>
			d.upsert('INDENTED', 'value'),
		);
		expect(output).toBe(expected('whitespace-key.env'));
	});

	it('should round-trip a value containing spaces', () => {
		const output = roundTrip('spaces-value.env', (d) =>
			d.upsert('SPACES', 'a b c'),
		);
		expect(output).toBe(expected('spaces-value.env'));
	});
});

describe('golden rejections', () => {
	it('rejects a real on-disk file with mixed line endings', () => {
		const dir = mkdtempSync(join(tmpdir(), 'dotenv-extra-golden-'));
		const file = join(dir, 'mixed.env');
		copyFileSync(join(__dirname, '../tests/golden', 'mixed.env'), file);

		try {
			expect(() => new DotEnv(file)).toThrow(
				/Mixed line endings detected/,
			);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe('real disk encoding', () => {
	it('writes bytes in the encoding given at construction, not utf8', () => {
		const dir = mkdtempSync(join(tmpdir(), 'dotenv-extra-encoding-'));
		const file = join(dir, 'latin1.env');
		writeFileSync(file, 'A=1\n', 'latin1');

		try {
			const dotenv = new DotEnv(file, 'latin1');
			dotenv.upsert('B', 'café');
			dotenv.save();

			const bytes = readFileSync(file);
			expect(bytes.includes(Buffer.from('café', 'latin1'))).toBe(true);
			expect(bytes.includes(Buffer.from('café', 'utf8'))).toBe(false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe('golden fixture binding', () => {
	it('binds every source fixture to at least one test', () => {
		const goldenDir = join(__dirname, '../tests/golden');
		const testSource = readFileSync(__filename, 'utf8');
		const sourceFixtures = readdirSync(goldenDir).filter(
			(file) => file.endsWith('.env') && !file.endsWith('.expected.env'),
		);

		const unbound = sourceFixtures.filter(
			(fixture) => !testSource.includes(`'${fixture}'`),
		);

		expect(unbound).toEqual([]);
	});
});
