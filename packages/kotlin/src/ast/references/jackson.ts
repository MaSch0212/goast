import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// com.fasterxml.jackson.annotation
export const jsonTypeInfo: KtReferenceFactory = ktReference.factory('JsonTypeInfo', 'com.fasterxml.jackson.annotation');
export const jsonSubTypes: KtReferenceFactory = ktReference.factory('JsonSubTypes', 'com.fasterxml.jackson.annotation');
export const jsonClassDescription: KtReferenceFactory = ktReference.factory(
  'JsonClassDescription',
  'com.fasterxml.jackson.annotation',
);
export const jsonProperty: KtReferenceFactory = ktReference.factory('JsonProperty', 'com.fasterxml.jackson.annotation');
export const jsonPropertyDescription: KtReferenceFactory = ktReference.factory(
  'JsonPropertyDescription',
  'com.fasterxml.jackson.annotation',
);
export const jsonInclude: KtReferenceFactory = ktReference.factory('JsonInclude', 'com.fasterxml.jackson.annotation');
export const jsonIgnore: KtReferenceFactory = ktReference.factory('JsonIgnore', 'com.fasterxml.jackson.annotation');
export const jsonAnySetter: KtReferenceFactory = ktReference.factory(
  'JsonAnySetter',
  'com.fasterxml.jackson.annotation',
);
export const jsonAnyGetter: KtReferenceFactory = ktReference.factory(
  'JsonAnyGetter',
  'com.fasterxml.jackson.annotation',
);
