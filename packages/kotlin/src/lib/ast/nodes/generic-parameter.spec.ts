import { ktGenericParameter } from './generic-parameter';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktGenericParameter', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  describe('single', () => {
    it('should write the name of the parameter', () => {
      builder.append(ktGenericParameter('T'));
      expect(builder.toString(false)).toBe('T');
    });

    it('should write the constraint if it exists', () => {
      builder.append(ktGenericParameter('T', { constraint: 'number' }));
      expect(builder.toString(false)).toBe('T : number');
    });

    it('should render injections', () => {
      builder.append(ktGenericParameter('T', { inject: { before: ['before'], after: ['after'] } }));
      expect(builder.toString(false)).toBe('beforeTafter');
    });
  });

  describe('multiple', () => {
    it('should not write anything if the node is empty', () => {
      ktGenericParameter.write(builder, []);
      expect(builder.toString(false)).toBe('');
    });

    it('should write a single parameter', () => {
      ktGenericParameter.write(builder, [ktGenericParameter('T')]);
      expect(builder.toString(false)).toBe('<T>');
    });

    it('should write all the parameters', () => {
      ktGenericParameter.write(builder, [ktGenericParameter('T'), ktGenericParameter('U')]);
      expect(builder.toString(false)).toBe('<T, U>');
    });
  });
});
