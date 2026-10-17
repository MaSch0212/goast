import { csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// System.ComponentModel.DataAnnotations
export const required: CsReferenceFactory = csReference.factory('Required', 'System.ComponentModel.DataAnnotations');
export const stringLength: CsReferenceFactory = csReference.factory(
  'StringLength',
  'System.ComponentModel.DataAnnotations',
);
export const minLength: CsReferenceFactory = csReference.factory('MinLength', 'System.ComponentModel.DataAnnotations');
export const maxLength: CsReferenceFactory = csReference.factory('MaxLength', 'System.ComponentModel.DataAnnotations');
export const range: CsReferenceFactory = csReference.factory('Range', 'System.ComponentModel.DataAnnotations');
export const regularExpression: CsReferenceFactory = csReference.factory(
  'RegularExpression',
  'System.ComponentModel.DataAnnotations',
);
export const emailAddress: CsReferenceFactory = csReference.factory(
  'EmailAddress',
  'System.ComponentModel.DataAnnotations',
);
