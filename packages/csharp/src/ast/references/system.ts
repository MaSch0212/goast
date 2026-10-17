import { type CsGenericReferenceFactory, csReference, type CsReferenceFactory } from '../nodes/reference.ts';

// keyword aliases
export const string: CsReferenceFactory = csReference.factory('string');
export const int: CsReferenceFactory = csReference.factory('int');
export const long: CsReferenceFactory = csReference.factory('long');
export const short: CsReferenceFactory = csReference.factory('short');
export const byte: CsReferenceFactory = csReference.factory('byte');
export const sbyte: CsReferenceFactory = csReference.factory('sbyte');
export const uint: CsReferenceFactory = csReference.factory('uint');
export const ulong: CsReferenceFactory = csReference.factory('ulong');
export const ushort: CsReferenceFactory = csReference.factory('ushort');
export const bool: CsReferenceFactory = csReference.factory('bool');
export const char: CsReferenceFactory = csReference.factory('char');
export const double: CsReferenceFactory = csReference.factory('double');
export const float: CsReferenceFactory = csReference.factory('float');
export const decimal: CsReferenceFactory = csReference.factory('decimal');
export const object: CsReferenceFactory = csReference.factory('object');

// System
export const guid: CsReferenceFactory = csReference.factory('Guid', 'System');
export const dateTimeOffset: CsReferenceFactory = csReference.factory('DateTimeOffset', 'System');
export const dateTime: CsReferenceFactory = csReference.factory('DateTime', 'System');
export const dateOnly: CsReferenceFactory = csReference.factory('DateOnly', 'System');
export const timeOnly: CsReferenceFactory = csReference.factory('TimeOnly', 'System');
export const timeSpan: CsReferenceFactory = csReference.factory('TimeSpan', 'System');
export const uri: CsReferenceFactory = csReference.factory('Uri', 'System');
export const exception: CsReferenceFactory = csReference.factory('Exception', 'System');
export const argumentException: CsReferenceFactory = csReference.factory('ArgumentException', 'System');
export const argumentNullException: CsReferenceFactory = csReference.factory('ArgumentNullException', 'System');
export const invalidOperationException: CsReferenceFactory = csReference.factory('InvalidOperationException', 'System');
export const notSupportedException: CsReferenceFactory = csReference.factory('NotSupportedException', 'System');
export const iDisposable: CsReferenceFactory = csReference.factory('IDisposable', 'System');
/** `System.ObsoleteAttribute`, referenced without the `Attribute` suffix as is usual for attribute usages. */
export const obsolete: CsReferenceFactory = csReference.factory('Obsolete', 'System');
export const obsoleteAttribute: CsReferenceFactory = obsolete;
export const flags: CsReferenceFactory = csReference.factory('Flags', 'System');
export const systemEnum: CsReferenceFactory = csReference.factory('Enum', 'System');

// System.IO
export const stream: CsReferenceFactory = csReference.factory('Stream', 'System.IO');

// System.Collections.Generic
export const list: CsGenericReferenceFactory<1> = csReference.genericFactory<1>('List', 'System.Collections.Generic');
export const iReadOnlyList: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'IReadOnlyList',
  'System.Collections.Generic',
);
export const iList: CsGenericReferenceFactory<1> = csReference.genericFactory<1>('IList', 'System.Collections.Generic');
export const dictionary: CsGenericReferenceFactory<2> = csReference.genericFactory<2>(
  'Dictionary',
  'System.Collections.Generic',
);
export const iReadOnlyDictionary: CsGenericReferenceFactory<2> = csReference.genericFactory<2>(
  'IReadOnlyDictionary',
  'System.Collections.Generic',
);
export const iDictionary: CsGenericReferenceFactory<2> = csReference.genericFactory<2>(
  'IDictionary',
  'System.Collections.Generic',
);
export const iEnumerable: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'IEnumerable',
  'System.Collections.Generic',
);
export const iCollection: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'ICollection',
  'System.Collections.Generic',
);
export const hashSet: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'HashSet',
  'System.Collections.Generic',
);
export const keyValuePair: CsGenericReferenceFactory<2> = csReference.genericFactory<2>(
  'KeyValuePair',
  'System.Collections.Generic',
);

// System.Threading
export const cancellationToken: CsReferenceFactory = csReference.factory('CancellationToken', 'System.Threading');

// System.Threading.Tasks
export const task: CsReferenceFactory = csReference.factory('Task', 'System.Threading.Tasks');
export const taskOf: CsGenericReferenceFactory<1> = csReference.genericFactory<1>('Task', 'System.Threading.Tasks');
export const valueTask: CsReferenceFactory = csReference.factory('ValueTask', 'System.Threading.Tasks');
export const valueTaskOf: CsGenericReferenceFactory<1> = csReference.genericFactory<1>(
  'ValueTask',
  'System.Threading.Tasks',
);
