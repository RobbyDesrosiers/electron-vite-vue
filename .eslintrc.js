module.exports = {
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
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
    // Override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
  },
}
