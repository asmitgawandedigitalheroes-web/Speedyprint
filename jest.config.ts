import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Intercept fabric imports and redirect to our manual mock
    '^fabric$': '<rootDir>/src/__mocks__/fabric.ts',
  },
  // Coverage collection scoped to files with actual tests
  collectCoverageFrom: [
    'src/lib/editor/fabricUtils.ts',
    'src/lib/editor/useEditorStore.ts',
    'src/lib/editor/history.ts',
    'src/components/editor/Toolbar.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        // Relax strict checks for test files
        esModuleInterop: true,
      },
    }],
  },
  // Don't transform node_modules except packages that ship ESM
  transformIgnorePatterns: [
    'node_modules/(?!(fabric|@fabric)/)',
  ],
  // Increase timeout for async tests
  testTimeout: 10000,
}

export default createJestConfig(config)
