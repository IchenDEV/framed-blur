/**
 * progressive-blur
 *
 * Framework-agnostic entry point. Re-exports the pure core and the vanilla DOM
 * helpers. The React component lives at `progressive-blur/react` and the
 * `<progressive-blur>` custom element at `progressive-blur/element`, so neither
 * React nor the custom-element registration is pulled in unless you ask for it.
 */
export * from './core';
export * from './vanilla';
