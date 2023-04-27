import { join } from 'path';
import { OpenApiParser } from '../../parser.js';
import { ApiSchema } from '../../types.js';
import { verify } from '../verify.js';

describe.only('Schemas', () => {
  test('Simple Schemas', async () => {
    const filePath = join(__dirname, 'schemas', 'simple-schemas.yml');
    const data = await new OpenApiParser().parseApisAndTransform(filePath);
    await verify(data);
  });
});
