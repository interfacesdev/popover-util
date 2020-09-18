module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: 'babel-eslint',
  extends: [
    'airbnb-base',
  ],
  rules: {
    'no-console': [
      1,
      {
        allow: ['warn', 'error'],
      },
    ],
    'no-param-reassign': [2, { props: false }],
    'no-plusplus': 0,
  },
  overrides: [
    {
      files: [
        '**/test/**/*.@(spec|test).[jt]s',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
