import type { PartialMappingFirst } from './partial-mapping-first';
import type { PartialMappingSecond } from './partial-mapping-second';
import type { PartialMappingThird } from './partial-mapping-third';

type PartialMappingDiscriminator = ('PartialMappingThird') | ('first') | ('second');

export type _PartialMappingBase = (PartialMappingFirst) | (PartialMappingSecond) | (PartialMappingThird);

export type PartialMapping<TKind extends PartialMappingDiscriminator = PartialMappingDiscriminator> = (_PartialMappingBase) & (({
        PartialMappingThird: ({
            kind: 'PartialMappingThird';
          }) & (PartialMappingThird);
        first: ({
            kind: 'first';
          }) & (PartialMappingFirst);
        second: ({
            kind: 'second';
          }) & (PartialMappingSecond);
      })[TKind]);
