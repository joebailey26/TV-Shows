module.exports = {
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss'
    }
  ],
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue'
  ],
  plugins: [
    'stylelint-order',
    '@galexia-agency/stylelint-config-galexia/plugin'
  ],
  defaultSeverity: 'warning',
  rules: {
    "plugin/rational-order": [true, {
      "border-in-box-model": false,
      "empty-line-between-groups": false,
    }],
    'custom-property-empty-line-before': null,
    'selector-id-pattern': null,
    'declaration-property-value-no-unknown': true,
    'custom-property-pattern': null,
    'block-closing-brace-newline-before': null,
    indentation: 2,
    'font-family-name-quotes': 'always-where-required',
    'string-quotes': 'single',
    'no-duplicate-selectors': true,
    'color-hex-case': 'upper',
    'color-hex-length': 'long',
    'color-named': 'always-where-possible',
    'order/properties-order': [
      [],
      {
        severity: 'error'
      }
    ],
    'order/order': [
      [
        {
          type: 'at-rule',
          hasBlock: false
        },
        'custom-properties',
        'declarations'
      ],
      {
        unspecified: 'ignore',
        disableFix: false
      }
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'at-root',
          'content',
          'each',
          'else',
          'error',
          'for',
          'function',
          'include',
          'if',
          'mixin',
          'return',
          'warn',
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'extend',
          'use'
        ]
      }
    ],
    'at-rule-disallowed-list': [
      'extend'
    ],
    'property-no-unknown': [
      true,
      {
        ignoreProperties: [
          'contain'
        ]
      }
    ],
    'function-url-no-scheme-relative': null,
    'declaration-colon-newline-after': null,
    'comment-word-disallowed-list': [
      [
        '/^TODO/',
        '/^FIXME/'
      ],
      {
        severity: 'warning'
      }
    ],
    'at-rule-no-vendor-prefix': true,
    'media-feature-name-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
    'selector-combinator-space-after': 'always',
    'selector-attribute-operator-space-before': 'never',
    'selector-attribute-operator-space-after': 'never',
    'selector-attribute-brackets-space-inside': 'never',
    'declaration-no-important': true,
    'declaration-colon-space-before': 'never',
    'declaration-colon-space-after': 'always',
    'property-no-vendor-prefix': true,
    'comment-whitespace-inside': 'always',
    'comment-empty-line-before': [
      'always',
      {
        except: [
          'first-nested'
        ],
        ignore: [
          'after-comment',
          'stylelint-commands'
        ]
      }
    ],
    'max-empty-lines': 1,
    'media-feature-range-operator-space-before': 'never',
    'media-feature-range-operator-space-after': 'always',
    'media-feature-parentheses-space-inside': 'never',
    'media-feature-colon-space-before': 'never',
    'media-feature-colon-space-after': 'always',
    'no-eol-whitespace': [
      true,
      {
        ignore: [
          'empty-lines'
        ]
      }
    ],
    'scss/selector-no-redundant-nesting-selector': true,
    'scss/at-import-no-partial-leading-underscore': true,
    'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
    'scss/at-else-closing-brace-space-after': 'always-intermediate',
    'scss/at-else-empty-line-before': 'never',
    'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
    'scss/at-if-closing-brace-space-after': 'always-intermediate',
    'declaration-empty-line-before': null,
    'block-closing-brace-newline-after': [
      'always',
      {
        ignoreAtRules: [
          'if',
          'else'
        ]
      }
    ],
    'rule-empty-line-before': 'never',
    'declaration-bang-space-before': 'never',
    'selector-list-comma-newline-after': null,
    'declaration-block-trailing-semicolon': 'never',
    'no-descending-specificity': null,
    'selector-pseudo-element-colon-notation': 'single',
    'at-rule-empty-line-before': null,
    'number-max-precision': 4,
    'declaration-block-no-redundant-longhand-properties': true,
    'number-leading-zero': 'never',
    'number-no-trailing-zeros': true,
    'unit-case': 'lower',
    'length-zero-no-unit': true,
    'value-keyword-case': 'lower',
    'property-case': 'lower',
    'declaration-property-unit-disallowed-list': {
      opacity: [
        '%'
      ]
    },
    'font-family-no-missing-generic-family-keyword': [
      true,
      {
        severity: 'error'
      }
    ],
    'selector-class-pattern': null
  }
}
