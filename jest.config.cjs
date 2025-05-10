module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    // services の GAS API 呼び出し部だけモックに差し替える例
    '^services/(.*)$': '<rootDir>/tests/__mocks__/services/$1',
  },
};
