/**
 * framed-blur
 *
 * Framework-agnostic entry point. Re-exports the pure core and the vanilla DOM
 * helpers. The React component lives at `framed-blur/react` and the
 * `<framed-blur>` custom element at `framed-blur/element`, so neither
 * React nor the custom-element registration is pulled in unless you ask for it.
 */
export * from './core';
export * from './vanilla';
