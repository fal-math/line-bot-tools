module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  setupFiles: [
    "<rootDir>/src/_test_/setup.gas.ts"
  ],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    // services の GAS API 呼び出し部だけモックに差し替える例
    // '^services/(.*)$': '<rootDir>/tests/__mocks__/services/$1',
  },
};
