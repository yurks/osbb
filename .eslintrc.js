module.exports = {
  env: {
    'googleappsscript/googleappsscript': true,
    node: true,
    browser: true,
    es6: true
  },
  plugins: ['googleappsscript', 'html', 'prettier'],
  extends: ['plugin:json/recommended', 'eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        trailingComma: 'none',
        printWidth: 120
      }
    ]
  }
};
