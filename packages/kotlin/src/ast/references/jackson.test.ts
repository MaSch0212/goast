import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import * as jackson from './jackson.ts';

describe('jackson', () => {
  describe('jackson references', () => {
    describe('springBootVersion-dependent packages', () => {
      const movedRefs: { name: string; factory: (v?: 3 | 4) => { packageName: string | null } }[] = [
        { name: 'objectMapper', factory: jackson.objectMapper },
        { name: 'serializationFeature', factory: jackson.serializationFeature },
        { name: 'deserializationFeature', factory: jackson.deserializationFeature },
        { name: 'jacksonObjectMapper', factory: jackson.jacksonObjectMapper },
      ];

      const expectedV3: Record<string, string> = {
        objectMapper: 'com.fasterxml.jackson.databind',
        serializationFeature: 'com.fasterxml.jackson.databind',
        deserializationFeature: 'com.fasterxml.jackson.databind',
        jacksonObjectMapper: 'com.fasterxml.jackson.module.kotlin',
      };

      const expectedV4: Record<string, string> = {
        objectMapper: 'tools.jackson.databind',
        serializationFeature: 'tools.jackson.databind',
        deserializationFeature: 'tools.jackson.databind',
        jacksonObjectMapper: 'tools.jackson.module.kotlin',
      };

      for (const { name, factory } of movedRefs) {
        it(`defaults ${name} to the Jackson 2 (Spring Boot 3) package`, () => {
          expect(factory().packageName).toBe(expectedV3[name]);
        });

        it(`resolves ${name} to the Jackson 2 package for Spring Boot 3`, () => {
          expect(factory(3).packageName).toBe(expectedV3[name]);
        });

        it(`resolves ${name} to the Jackson 3 (tools.jackson) package for Spring Boot 4`, () => {
          expect(factory(4).packageName).toBe(expectedV4[name]);
        });
      }
    });

    // Jackson 3 moved WRITE_DATES_AS_TIMESTAMPS off SerializationFeature onto DateTimeFeature, which exists
    // only in Jackson 3 — so unlike its neighbours this reference takes no Spring Boot version. Defect 26 was
    // the Boot 4 branch emitting the member against `tools.jackson.databind.SerializationFeature`, where it
    // does not exist, breaking every unit of the profile.
    describe('dateTimeFeature', () => {
      it('resolves to the Jackson 3 config package', () => {
        expect(jackson.dateTimeFeature().packageName).toBe('tools.jackson.databind.cfg');
      });

      // `refName` is a property of the FACTORY (reference.ts:135), not of the reference it creates — the
      // created reference exposes `name` instead. The annotation block above uses `factory.refName` the
      // same way.
      it('is named DateTimeFeature', () => {
        expect(jackson.dateTimeFeature.refName).toBe('DateTimeFeature');
      });
    });

    describe('annotations stay on com.fasterxml.jackson.annotation', () => {
      const annotationRefs = [
        jackson.jsonProperty,
        jackson.jsonInclude,
        jackson.jsonTypeInfo,
        jackson.jsonSubTypes,
        jackson.jsonIgnore,
        jackson.jsonAnySetter,
        jackson.jsonAnyGetter,
        jackson.jsonClassDescription,
        jackson.jsonPropertyDescription,
      ];

      for (const factory of annotationRefs) {
        it(`keeps ${factory.refName} on com.fasterxml.jackson.annotation`, () => {
          expect(factory().packageName).toBe('com.fasterxml.jackson.annotation');
        });
      }
    });
  });
});
