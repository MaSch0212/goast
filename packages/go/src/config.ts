import type { DefaultGenerationProviderConfig, OpenApiGeneratorConfig } from '@goast/core';

/**
 * The configuration that all Go generators share. It extends the core `OpenApiGeneratorConfig` with the module path of
 * the generated code, the initialisms that identifiers are written with, and whether generated files start with a
 * header comment.
 * @see defaultGoGeneratorConfig
 */
export type GoGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The module path of the generated code, i.e. the import path of the output directory. It is only needed when
   * generated packages import each other, e.g. when the servers are generated into a different package than the
   * models. The import path of each package is this module path joined with the package's path relative to the output
   * directory, and trailing slashes are ignored.
   * @default 'example.com/generated'
   */
  modulePath: string;

  /**
   * Words that are written in all caps in identifiers, following the Go naming conventions (e.g. `PetID` instead of
   * `PetId`). Compared case-insensitively against each word of a name. Words that are not in this list are written in
   * title case.
   * @default defaultGoInitialisms
   * @see defaultGoInitialisms
   */
  initialisms: string[];

  /**
   * Whether to start every generated file with the `// Code generated ... DO NOT EDIT.` comment that Go tools use to
   * recognize generated code. The comment is written above the `package` clause.
   * @default true
   */
  addGeneratedHeader: boolean;

  /**
   * Whether to include the source OpenAPI document path in the generated documentation comments. The path is written as
   * a `Source:` line below the description of a schema or endpoint, including its location in the document.
   * @default false
   */
  includeSourceInDocs: boolean;
};

/**
 * The initialisms of the Go linters (`golint`, `staticcheck`), plus a few common in APIs. This is the default of the
 * `initialisms` option of `GoGeneratorConfig`.
 * @see GoGeneratorConfig
 */
export const defaultGoInitialisms: string[] = [
  'ACL',
  'API',
  'ASCII',
  'CPU',
  'CSS',
  'DNS',
  'EOF',
  'GUID',
  'HTML',
  'HTTP',
  'HTTPS',
  'ID',
  'IP',
  'JSON',
  'JWT',
  'LHS',
  'QPS',
  'RAM',
  'RHS',
  'RPC',
  'SLA',
  'SMTP',
  'SQL',
  'SSH',
  'TCP',
  'TLS',
  'TTL',
  'UDP',
  'UI',
  'UID',
  'URI',
  'URL',
  'UTF8',
  'UUID',
  'VM',
  'XML',
  'XMPP',
  'XSRF',
  'XSS',
];

/**
 * The default values of the Go generator configuration. Each property's `@default` tag in `GoGeneratorConfig` gives the
 * same value. `indent` is tabs here, because `gofmt` indents with tabs.
 * @see GoGeneratorConfig
 */
export const defaultGoGeneratorConfig: DefaultGenerationProviderConfig<GoGeneratorConfig> = {
  // gofmt indents with tabs.
  indent: { type: 'tabs' },

  modulePath: 'example.com/generated',
  initialisms: defaultGoInitialisms,
  addGeneratedHeader: true,
  includeSourceInDocs: false,
};
