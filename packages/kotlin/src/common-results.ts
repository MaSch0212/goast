/**
 * Describes a type that a generated Kotlin file imports.
 */
export type KotlinImport = {
  /**
   * The package the type is declared in, such as `kotlin.collections`. Without a package, no import is written.
   */
  packageName?: string;
  /**
   * The name of the type to import from the package, such as `List`.
   */
  typeName: string;
};
