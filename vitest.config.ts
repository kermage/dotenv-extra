import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			thresholds: {
				lines: 100,
				branches: 100,
				functions: 100,
				statements: 100,
			},
		},
	},
});
