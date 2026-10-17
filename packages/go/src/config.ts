import type { DefaultGenerationProviderConfig, OpenApiGeneratorConfig } from '@goast/core';

export type GoGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The module path of the generated code, i.e. the import path of the output directory. It is only needed when
   * generated packages import each other, e.g. when the servers are generated into a different package than the
   * models.
   * @default 'example.com/generated'
   */
  modulePath: string;

  /**
   * Words that are written in all caps in identifiers, following the Go naming conventions (e.g. `PetID` instead of
   * `PetId`). Compared case-insensitively against each word of a name.
   */
  initialisms: string[];

  /**
   * Whether to start every generated file with the `// Code generated ... DO NOT EDIT.` comment that Go tools use to
   * recognize generated code.
   * @default true
   */
  addGeneratedHeader: boolean;

  /**
   * Whether to include the source OpenAPI document path in the generated documentation comments.
   * @default false
   */
  includeSourceInDocs: boolean;
};

/** The initialisms of the Go linters (`golint`, `staticcheck`), plus a few common in APIs. */
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

export const defaultGoGeneratorConfig: DefaultGenerationProviderConfig<GoGeneratorConfig> = {
  // gofmt indents with tabs.
  indent: { type: 'tabs' },

  modulePath: 'example.com/generated',
  initialisms: defaultGoInitialisms,
  addGeneratedHeader: true,
  includeSourceInDocs: false,
};
