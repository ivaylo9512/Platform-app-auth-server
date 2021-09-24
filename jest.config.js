/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: [
    "text",
    "cobertura"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/*.ts"
  ],
  moduleFileExtensions: [ "js", "ts" ],
};