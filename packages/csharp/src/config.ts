import type {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

export type CSharpGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The root namespace of all generated code. Every generator appends its own `namespaceSuffix` to it.
   * @default 'OpenApi.Generated'
   */
  rootNamespace: string;

  typeNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  parameterNameCasing: StringCasing | StringCasingWithOptions;
  methodNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;

  /**
   * Namespaces that are already imported project-wide (e.g. through `<Using Include="..." />` or
   * `ImplicitUsings`). `using` directives for these namespaces are not emitted.
   * @default []
   */
  globalUsings: string[];

  /**
   * Whether to include the source OpenAPI document path in the generated documentation comments.
   * @default false
   */
  includeSourceInDocs: boolean;
};

export const defaultCSharpGeneratorConfig: DefaultGenerationProviderConfig<CSharpGeneratorConfig> = {
  indent: { type: 'spaces', count: 4 },

  rootNamespace: 'OpenApi.Generated',

  typeNameCasing: 'pascal',
  propertyNameCasing: 'pascal',
  parameterNameCasing: 'camel',
  methodNameCasing: 'pascal',
  enumValueNameCasing: 'pascal',

  globalUsings: [],
  includeSourceInDocs: false,
};
