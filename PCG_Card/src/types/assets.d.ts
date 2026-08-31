/**
 * The web build imports `global.css` as a side effect from `@/constants/theme`.
 * TypeScript has no notion of CSS modules, so declare them as opaque.
 */
declare module '*.css';
