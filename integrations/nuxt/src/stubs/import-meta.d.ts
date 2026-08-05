// Typecheck-only augmentation for the environment flags Nuxt defines on
// `import.meta` when compiling runtime files inside an app.

declare global {
  interface ImportMeta {
    readonly server: boolean;
    readonly client: boolean;
  }
}

export {};
