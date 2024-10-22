import { ktReference } from '../nodes/reference.ts';

// com.fasterxml.jackson.annotation
export const jsonTypeInfo = ktReference.factory('JsonTypeInfo', 'com.fasterxml.jackson.annotation');
export const jsonSubTypes = ktReference.factory('JsonSubTypes', 'com.fasterxml.jackson.annotation');
export const jsonProperty = ktReference.factory('JsonProperty', 'com.fasterxml.jackson.annotation');
export const jsonInclude = ktReference.factory('JsonInclude', 'com.fasterxml.jackson.annotation');
export const jsonIgnore = ktReference.factory('JsonIgnore', 'com.fasterxml.jackson.annotation');
export const jsonAnySetter = ktReference.factory('JsonAnySetter', 'com.fasterxml.jackson.annotation');
export const jsonAnyGetter = ktReference.factory('JsonAnyGetter', 'com.fasterxml.jackson.annotation');
