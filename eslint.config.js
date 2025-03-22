export default [
  {
    // Common settings
    ignores: ["node_modules/**", "build/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
      },
    },
    
    // Rules for all files
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "single", { "avoidEscape": true }],
      "indent": ["error", 4],
      "no-unused-vars": "warn",
      "no-console": "off",
      "comma-dangle": ["warn", "always-multiline"],
    },
  },
]; 