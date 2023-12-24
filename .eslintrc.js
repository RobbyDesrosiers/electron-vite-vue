module.exports = {
  env: {
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  plugins: ['vue', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    'prettier', // Add this line
    'plugin:prettier/recommended', // Make sure this is the last element in the array
    // 'plugin:vue/vue3-strongly-recommended', // or this
    // 'plugin:vue/vue3-recommended', // or this
  ],
  rules: {
    'linebreak-style': ['error', 'windows'],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    semi: ['always'],
    // Override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
  },
};
