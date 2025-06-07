import galexiaConfig from '@galexia-agency/eslint-config-galexia'
import drizzle from 'eslint-plugin-drizzle'
import parser from '@typescript-eslint/parser'

export default [
  ...galexiaConfig,
  {
    ignores: ['eslint.config.js'],
    files: ['**/*.{js,ts}'],
    plugins: {
      drizzle
    },
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
