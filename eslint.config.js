import pkg from "eslint/use-at-your-own-risk";
const { FlatCompat } = pkg;

const compat = new FlatCompat();

export default compat.config({
  env: { node: true },
  extends: [
    "galexia",
    "@nuxtjs/eslint-config-typescript",
    "plugin:drizzle/all",
  ],
  parserOptions: { parser: "@typescript-eslint/parser" },
  rules: {
    "vue/no-v-html": 0,
    "vue/multi-word-component-names": 0,
  },
  plugins: ["drizzle"],
});
