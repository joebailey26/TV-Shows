const galexiaConfig = require('stylelint-config-galexia');

const removedStylelint16Rules = new Set([
  'block-closing-brace-newline-after',
  'block-closing-brace-newline-before',
  'color-hex-case',
  'declaration-bang-space-before',
  'declaration-block-trailing-semicolon',
  'declaration-colon-newline-after',
  'declaration-colon-space-after',
  'declaration-colon-space-before',
  'indentation',
  'max-empty-lines',
  'media-feature-colon-space-after',
  'media-feature-colon-space-before',
  'media-feature-parentheses-space-inside',
  'media-feature-range-operator-space-after',
  'media-feature-range-operator-space-before',
  'no-eol-whitespace',
  'number-leading-zero',
  'number-no-trailing-zeros',
  'property-case',
  'selector-attribute-brackets-space-inside',
  'selector-attribute-operator-space-after',
  'selector-attribute-operator-space-before',
  'selector-combinator-space-after',
  'selector-list-comma-newline-after',
  'string-quotes',
  'unit-case'
]);

const rules = Object.fromEntries(
  Object.entries(galexiaConfig.rules).filter(([ruleName]) => !removedStylelint16Rules.has(ruleName))
);

delete rules['scss/at-import-no-partial-leading-underscore'];
rules['scss/load-no-partial-leading-underscore'] = true;

module.exports = {
  ...galexiaConfig,
  rules
};
