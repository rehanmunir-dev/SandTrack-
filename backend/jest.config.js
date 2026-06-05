export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
}
