import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// org.springframework.web.reactive.function
export const bodyInserters: KtReferenceFactory = ktReference.factory(
  'BodyInserters',
  'org.springframework.web.reactive.function',
);

// org.springframework.web.reactive.function.client
export const webClient: KtReferenceFactory = ktReference.factory(
  'WebClient',
  'org.springframework.web.reactive.function.client',
);
export const ResponseSpec: KtReferenceFactory = ktReference.factory(
  'ResponseSpec',
  'org.springframework.web.reactive.function.client.WebClient',
);
export const toEntity: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'toEntity',
  'org.springframework.web.reactive.function.client',
);
export const awaitBody: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitBody',
  'org.springframework.web.reactive.function.client',
);
export const awaitBodilessEntity: KtReferenceFactory = ktReference.factory(
  'awaitBodilessEntity',
  'org.springframework.web.reactive.function.client',
);
