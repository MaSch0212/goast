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

  /** Whether the identifier is taken. */
  public has(name: string): boolean {
    return this._used.has(name);
  }

  /**
   * Reserves an identifier based on `name` and returns it.
   * @param key Identifies what the identifier is for (e.g. a schema id). Reserving the same key again returns the
   * identifier reserved the first time, so a declaration and all references to it agree.
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
   */
  public reserveFirst(candidates: readonly [string, ...string[]], key?: string): string {
    if (key !== undefined) {
      const existing = this._byKey.get(key);
      if (existing !== undefined) return existing;
    }
    return this.reserve(candidates.find((x) => !this._used.has(x)) ?? candidates[0], key);
  }

  /** The identifier reserved for the key, if any. */
  public get(key: string): string | undefined {
    return this._byKey.get(key);
  }
}

const registries = new WeakMap<object, Map<string, GoIdentifierRegistry>>();

/**
 * The registry of a package within one generator run.
 * @param run An object that is the same for all generators of the run, e.g. the `ApiData` of the context.
 * @param importPath The import path of the package.
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
