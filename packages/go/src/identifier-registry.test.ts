import { describe, expect, it } from 'vitest';

import { GoIdentifierRegistry } from './identifier-registry.ts';

describe('GoIdentifierRegistry', () => {
  it('appends a counter to a name that is taken', () => {
    const registry = new GoIdentifierRegistry();

    expect(registry.reserve('Pet')).toBe('Pet');
    expect(registry.reserve('Pet')).toBe('Pet2');
  });

  it('returns the same name for the same key', () => {
    const registry = new GoIdentifierRegistry();

    expect(registry.reserve('Pet', 'schema-1')).toBe('Pet');
    expect(registry.reserve('Pet', 'schema-1')).toBe('Pet');
    expect(registry.get('schema-1')).toBe('Pet');
  });

  it('reserves the first free candidate', () => {
    const registry = new GoIdentifierRegistry();
    registry.reserve('CreatePetRequest');

    expect(registry.reserveFirst(['CreatePetRequest', 'CreatePetRequestObject'])).toBe('CreatePetRequestObject');
    expect(registry.reserveFirst(['CreatePetRequest', 'CreatePetRequestObject'])).toBe('CreatePetRequest2');
  });
});
