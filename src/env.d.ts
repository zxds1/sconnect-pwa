interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
