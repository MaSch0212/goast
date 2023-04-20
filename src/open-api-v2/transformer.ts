import { OpenApiTransformer } from '../types.js';

export const openApiV2Transformer: OpenApiTransformer<'2.0'> = {
  transformDocument: () => {},
  transformSchema: () => {},
  transformEndpoint: () => {},
};
