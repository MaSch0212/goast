/**
 * The identifiers declared at the top level of one Go package.
 *
 * Every top-level declaration of a package shares one namespace across all of its files, so two schemas whose names
 * map to the same identifier (`pet_id` and `PetId` both become `PetID`), or a schema and a type a server generator
 * adds, would not compile. Names are therefore reserved here, and a taken one gets a counter (`PetID2`).
 *
 * The registry is shared by all generators of one run that write into the same package, see
 * {@link getGoIdentifierRegistry}.
 */
export class GoIdentifierRegistry {
  private readonly _used = new Set<string>();
  private readonly _byKey = new Map<string, string>();

  /**
   * Checks whether an identifier is taken.
   * @param name The identifier to check.
   * @returns `true` if the identifier is reserved, otherwise `false`.
   */
  public has(name: string): boolean {
    return this._used.has(name);
  }

  /**
   * Reserves an identifier based on `name` and returns it. If the name is taken, a counter is appended to it, starting
   * with `2` (`PetID`, `PetID2`, `PetID3`, ...).
   * @param name The preferred identifier.
   * @param key Identifies what the identifier is for (e.g. a schema id). Reserving the same key again returns the
   * identifier reserved the first time, so a declaration and all references to it agree.
   * @returns The reserved identifier.
   */
  public reserve(name: string, key?: string): string {
    if (key !== undefined) {
      const existing = this._byKey.get(key);
      if (existing !== undefined) return existing;
    }

    let unique = name;
    for (let i = 2; this._used.has(unique); i++) unique = `${name}${i}`;
    this._used.add(unique);
    if (key !== undefined) this._byKey.set(key, unique);
    return unique;
  }

  /**
   * Reserves the first of the candidates that is still free, e.g. `CreatePetRequest` and then `CreatePetRequestObject`
   * when a schema is named `CreatePetRequest` already. If all are taken, the first gets a counter like in `reserve`.
   * Like `reserve`, a key that already has an identifier returns that identifier.
   * @param candidates The identifiers to try, in order of preference. The first one is used if all are taken.
   * @param key Identifies what the identifier is for, see `reserve`.
   * @returns The reserved identifier.
   */
  public reserveFirst(candidates: readonly [string, ...string[]], key?: string): string {
    if (key !== undefined) {
      const existing = this._byKey.get(key);
      if (existing !== undefined) return existing;
    }
    return this.reserve(candidates.find((x) => !this._used.has(x)) ?? candidates[0], key);
  }

  /**
   * Gets the identifier reserved for a key.
   * @param key The key the identifier was reserved with.
   * @returns The identifier, or `undefined` if no identifier was reserved for the key.
   */
  public get(key: string): string | undefined {
    return this._byKey.get(key);
  }
}

const registries = new WeakMap<object, Map<string, GoIdentifierRegistry>>();

/**
 * Gets the registry of a package within one generator run. The registry is created on first use, and every later call
 * with the same run and import path returns the same registry.
 * @param run An object that is the same for all generators of the run, e.g. the `ApiData` of the context.
 * @param importPath The import path of the package.
 * @returns The registry of the package for the run.
 */
export function getGoIdentifierRegistry(run: object, importPath: string): GoIdentifierRegistry {
  let packages = registries.get(run);
  if (!packages) {
    packages = new Map();
    registries.set(run, packages);
  }
  let registry = packages.get(importPath);
  if (!registry) {
    registry = new GoIdentifierRegistry();
    packages.set(importPath, registry);
  }
  return registry;
}
