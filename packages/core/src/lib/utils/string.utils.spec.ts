import {
  getWords,
  toCamelCase,
  wordToCasing,
  toCustomCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toCasing,
} from './string.utils.js';
import {
  WordCasing,
  CamelCaseOptions,
  PascalCaseOptions,
  KebabCaseOptions,
  SnakeCaseOptions,
  CustomCaseOptions,
} from './string.utils.types.js';

describe('getWords', () => {
  it('should return an empty array for a nullish string', () => {
    expect(getWords(null)).toEqual([]);
    expect(getWords(undefined)).toEqual([]);
  });

  it('should return an empty array for an empty string', () => {
    const inputStr = '';
    const expectedOutput: string[] = [];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should split camelCase strings into words', () => {
    const inputStr = 'camelCaseString';
    const expectedOutput = ['camel', 'Case', 'String'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should split PascalCase strings into words', () => {
    const inputStr = 'PascalCaseString';
    const expectedOutput = ['Pascal', 'Case', 'String'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should split snake_case strings into words', () => {
    const inputStr = 'snake_case_string';
    const expectedOutput = ['snake', 'case', 'string'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should split kebab-case strings into words', () => {
    const inputStr = 'kebab-case-string';
    const expectedOutput = ['kebab', 'case', 'string'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should remove non-alphanumerical characters and split into words', () => {
    const inputStr = 'some!@#weird?%case';
    const expectedOutput = ['some', 'weird', 'case'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should remove leading numbers and non-alphanumeric characters', () => {
    const inputStr = '123-someWords';
    const expectedOutput = ['some', 'Words'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should treat numbers following a word as a separate word', () => {
    const inputStr = 'someWords123';
    const expectedOutput = ['some', 'Words', '123'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should handle strings containing only numbers and/or non-alphanumeric characters', () => {
    const inputStr = '123456@!$#';
    const expectedOutput: string[] = [];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should handle words entirely in uppercase', () => {
    const inputStr = 'UPPERCASE';
    const expectedOutput = ['UPPERCASE'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should handle string with words in uppercase and lowercase', () => {
    const inputStr = 'lowercaseUPPERCASELowercase';
    const expectedOutput = ['lowercase', 'UPPERCASE', 'Lowercase'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should handle string with words in uppercase and lowercase seperated by some other characters', () => {
    const inputStr = 'lowercaseUPPERCASE!@#$%^&*()lowercase';
    const expectedOutput = ['lowercase', 'UPPERCASE', 'lowercase'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });

  it('should handle string with words in uppercase and lowercase seperated by numbers', () => {
    const inputStr = 'lowercaseUPPERCASE123lowercase';
    const expectedOutput = ['lowercase', 'UPPERCASE', '123', 'lowercase'];

    expect(getWords(inputStr)).toEqual(expectedOutput);
  });
});

describe('wordToCasing', () => {
  const testCases: Array<[string, WordCasing, string]> = [
    ['helloWorld', 'unchanged', 'helloWorld'],
    ['helloWorld', 'all-lower', 'helloworld'],
    ['helloWorld', 'all-upper', 'HELLOWORLD'],
    ['helloWorld', 'first-upper', 'HelloWorld'],
    ['helloWorld', 'first-lower', 'helloWorld'],
    ['helloWorld', 'first-upper-then-lower', 'Helloworld'],
    ['helloWorld', 'first-lower-then-upper', 'hELLOWORLD'],
    ['helloWorld', 'first-upper-alternating', 'HeLlOwOrLd'],
    ['helloWorld', 'first-lower-alternating', 'hElLoWoRlD'],
  ];

  testCases.forEach(([inputStr, casing, expectedOutput]) => {
    it(`should convert string to the specified casing: ${casing}`, () => {
      expect(wordToCasing(inputStr, casing)).toBe(expectedOutput);
    });
  });

  it('should handle nullish string input', () => {
    expect(wordToCasing(null, 'all-lower')).toBe('');
    expect(wordToCasing(undefined, 'all-lower')).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const casing: WordCasing = 'all-lower';
    const expectedOutput = '';

    expect(wordToCasing(inputStr, casing)).toBe(expectedOutput);
  });
});

describe('toCamelCase', () => {
  it('should convert string to camelCase', () => {
    const inputStr = 'some_string-toCamel_case';
    const expectedOutput = 'someStringToCamelCase';

    expect(toCamelCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to camelCase with all characters except the first one in lowercase for each word', () => {
    const inputStr = 'Another_STRING-toCAMEL_case';
    const expectedOutput = 'anotherStringToCamelCase';

    expect(toCamelCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to camelCase with all characters except the first one in lowercase for each word when providing the lowerCase option', () => {
    const inputStr = 'Another_STRING-toCAMEL_case';
    const options: Partial<CamelCaseOptions> = { keepOriginalCase: false };
    const expectedOutput = 'anotherStringToCamelCase';

    expect(toCamelCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to camelCase with the original casing for characters except the first one for each word when providing the lowerCase option', () => {
    const inputStr = 'yetAnother_STRING-toCAMEL_case';
    const options: Partial<CamelCaseOptions> = { keepOriginalCase: true };
    const expectedOutput = 'yetAnotherSTRINGToCAMELCase';

    expect(toCamelCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should add prefix and suffix to the camelCase string', () => {
    const inputStr = 'example_string-forCamel_case';
    const options: Partial<CamelCaseOptions> = {
      prefix: 'pre-',
      suffix: '-post',
    };
    const expectedOutput = 'pre-exampleStringForCamelCase-post';

    expect(toCamelCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input', () => {
    expect(toCamelCase(null)).toBe('');
    expect(toCamelCase(undefined)).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const expectedOutput = '';

    expect(toCamelCase(inputStr)).toBe(expectedOutput);
  });

  it('should handle nullish string input with prefix and suffix', () => {
    const options: Partial<CamelCaseOptions> = {
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toCamelCase(null, options)).toBe(expectedOutput);
    expect(toCamelCase(undefined, options)).toBe(expectedOutput);
  });

  it('should handle empty string input with prefix and suffix', () => {
    const inputStr = '';
    const options: Partial<CamelCaseOptions> = {
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toCamelCase(inputStr, options)).toBe(expectedOutput);
  });
});

describe('toPascalCase', () => {
  it('should convert string to PascalCase', () => {
    const inputStr = 'some_string-toPascal_case';
    const expectedOutput = 'SomeStringToPascalCase';

    expect(toPascalCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to PascalCase with all characters except the first one in lowercase for each word', () => {
    const inputStr = 'Another_STRING-toPASCAL_case';
    const expectedOutput = 'AnotherStringToPascalCase';

    expect(toPascalCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to PascalCase with all characters except the first one in lowercase for each word when providing the lowerCase option', () => {
    const inputStr = 'Another_STRING-toPASCAL_case';
    const options: Partial<PascalCaseOptions> = { keepOriginalCase: false };
    const expectedOutput = 'AnotherStringToPascalCase';

    expect(toPascalCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to PascalCase with the original casing for characters except the first one for each word when providing the lowerCase option', () => {
    const inputStr = 'YetAnother_STRING-toPASCAL_case';
    const options: Partial<PascalCaseOptions> = { keepOriginalCase: true };
    const expectedOutput = 'YetAnotherSTRINGToPASCALCase';

    expect(toPascalCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should add prefix and suffix to the PascalCase string', () => {
    const inputStr = 'example_STRING-forPASCAL_case';
    const options: Partial<PascalCaseOptions> = {
      prefix: 'pre-',
      suffix: '-post',
    };
    const expectedOutput = 'pre-ExampleStringForPascalCase-post';

    expect(toPascalCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input', () => {
    expect(toPascalCase(null)).toBe('');
    expect(toPascalCase(undefined)).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const expectedOutput = '';

    expect(toPascalCase(inputStr)).toBe(expectedOutput);
  });

  it('should handle nullish string input with prefix and suffix', () => {
    const options: Partial<PascalCaseOptions> = {
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toPascalCase(null, options)).toBe(expectedOutput);
    expect(toPascalCase(undefined, options)).toBe(expectedOutput);
  });

  it('should handle empty string input with prefix and suffix', () => {
    const inputStr = '';
    const options: Partial<PascalCaseOptions> = {
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toPascalCase(inputStr, options)).toBe(expectedOutput);
  });
});

describe('toKebabCase', () => {
  it('should convert string to kebab-case', () => {
    const inputStr = 'someString_toKebabCase';
    const expectedOutput = 'some-string-to-kebab-case';

    expect(toKebabCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to kebab-case with specific casing for the first word', () => {
    const inputStr = 'anotherString_toKebabCase';
    const options: Partial<KebabCaseOptions> = { firstWordCasing: 'all-upper' };
    const expectedOutput = 'ANOTHER-string-to-kebab-case';

    expect(toKebabCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to kebab-case with specific casing for all words', () => {
    const inputStr = 'yetAnotherString_toKebabCase';
    const options: Partial<KebabCaseOptions> = { wordCasing: 'all-upper' };
    const expectedOutput = 'YET-ANOTHER-STRING-TO-KEBAB-CASE';

    expect(toKebabCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to kebab-case with specific casing for the first word and different casing for the rest of the words', () => {
    const inputStr = 'mixedCasing_string-toKebabCase';
    const options: Partial<KebabCaseOptions> = {
      wordCasing: 'first-upper-alternating',
      firstWordCasing: 'all-upper',
    };
    const expectedOutput = 'MIXED-CaSiNg-StRiNg-To-KeBaB-CaSe';

    expect(toKebabCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should add prefix and suffix to the kebab-case string', () => {
    const inputStr = 'exampleString_forKebabCase';
    const options: Partial<KebabCaseOptions> = {
      wordCasing: 'all-lower',
      prefix: 'pre-',
      suffix: '-post',
    };
    const expectedOutput = 'pre-example-string-for-kebab-case-post';

    expect(toKebabCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input', () => {
    expect(toKebabCase(null)).toBe('');
    expect(toKebabCase(undefined)).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const expectedOutput = '';

    expect(toKebabCase(inputStr)).toBe(expectedOutput);
  });

  it('should handle nullish string input with prefix and suffix', () => {
    const options: Partial<KebabCaseOptions> = {
      wordCasing: 'all-lower',
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toKebabCase(null, options)).toBe(expectedOutput);
    expect(toKebabCase(undefined, options)).toBe(expectedOutput);
  });

  it('should handle empty string input with prefix and suffix', () => {
    const inputStr = '';
    const options: Partial<KebabCaseOptions> = {
      wordCasing: 'all-lower',
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toKebabCase(inputStr, options)).toBe(expectedOutput);
  });
});

describe('toSnakeCase', () => {
  it('should convert string to snake_case', () => {
    const inputStr = 'someString_toSnakeCase';
    const expectedOutput = 'SOME_STRING_TO_SNAKE_CASE';

    expect(toSnakeCase(inputStr)).toBe(expectedOutput);
  });

  it('should convert string to snake_case with specific casing for the first word', () => {
    const inputStr = 'anotherString_toSnakeCase';
    const options: Partial<SnakeCaseOptions> = { firstWordCasing: 'all-lower' };
    const expectedOutput = 'another_STRING_TO_SNAKE_CASE';

    expect(toSnakeCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to snake_case with specific casing for all words', () => {
    const inputStr = 'yetAnotherString_toSnakeCase';
    const options: Partial<SnakeCaseOptions> = { wordCasing: 'all-lower' };
    const expectedOutput = 'yet_another_string_to_snake_case';

    expect(toSnakeCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should add prefix and suffix to the snake_case string', () => {
    const inputStr = 'exampleString_forSnakeCase';
    const options: Partial<SnakeCaseOptions> = {
      wordCasing: 'all-upper',
      prefix: 'pre_',
      suffix: '_post',
    };
    const expectedOutput = 'pre_EXAMPLE_STRING_FOR_SNAKE_CASE_post';

    expect(toSnakeCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input', () => {
    expect(toSnakeCase(null)).toBe('');
    expect(toSnakeCase(undefined)).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const expectedOutput = '';

    expect(toSnakeCase(inputStr)).toBe(expectedOutput);
  });

  it('should handle nullish string input with prefix and suffix', () => {
    const options: Partial<SnakeCaseOptions> = {
      wordCasing: 'all-upper',
      prefix: 'start_',
      suffix: '_end',
    };
    const expectedOutput = 'start__end';

    expect(toSnakeCase(null, options)).toBe(expectedOutput);
    expect(toSnakeCase(undefined, options)).toBe(expectedOutput);
  });

  it('should handle empty string input with prefix and suffix', () => {
    const inputStr = '';
    const options: Partial<SnakeCaseOptions> = {
      wordCasing: 'all-upper',
      prefix: 'start_',
      suffix: '_end',
    };
    const expectedOutput = 'start__end';

    expect(toSnakeCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to snake_case with specific casing for the first word and different casing for the rest of the words', () => {
    const inputStr = 'mixedCasing_string-toSnakeCase';
    const options: Partial<SnakeCaseOptions> = {
      wordCasing: 'first-lower-alternating',
      firstWordCasing: 'all-lower',
    };
    const expectedOutput = 'mixed_cAsInG_sTrInG_tO_sNaKe_cAsE';

    expect(toSnakeCase(inputStr, options)).toBe(expectedOutput);
  });
});

describe('toCustomCase', () => {
  it('should convert string to custom case with a custom separator', () => {
    const inputStr = 'someString_toCustomCase';
    const options: CustomCaseOptions = {
      wordCasing: 'first-upper-then-lower',
      wordSeparator: '+',
    };
    const expectedOutput = 'Some+String+To+Custom+Case';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to custom case with specific casing for the first word', () => {
    const inputStr = 'anotherString_toCustomCase';
    const options: CustomCaseOptions = {
      wordCasing: 'all-upper',
      firstWordCasing: 'all-lower',
      wordSeparator: '*',
    };
    const expectedOutput = 'another*STRING*TO*CUSTOM*CASE';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should convert string to custom case with a custom casing function', () => {
    const inputStr = 'customCasingFunction_example';
    const options: CustomCaseOptions = {
      wordCasing: (index) => (index % 2 === 0 ? 'all-lower' : 'all-upper'),
      wordSeparator: '-',
    };
    const expectedOutput = 'custom-CASING-function-EXAMPLE';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should add prefix and suffix to the custom case string', () => {
    const inputStr = 'exampleString_forCustomCase';
    const options: CustomCaseOptions = {
      wordCasing: 'first-upper-alternating',
      wordSeparator: '/',
      prefix: '<',
      suffix: '>',
    };
    const expectedOutput = '<ExAmPlE/StRiNg/FoR/CuStOm/CaSe>';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input', () => {
    const options: CustomCaseOptions = {
      wordCasing: 'all-lower',
      wordSeparator: '-',
    };

    expect(toCustomCase(null, options)).toBe('');
    expect(toCustomCase(undefined, options)).toBe('');
  });

  it('should handle empty string input', () => {
    const inputStr = '';
    const options: CustomCaseOptions = {
      wordCasing: 'all-lower',
      wordSeparator: '-',
    };
    const expectedOutput = '';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });

  it('should handle nullish string input with prefix and suffix', () => {
    const options: CustomCaseOptions = {
      wordCasing: 'all-lower',
      wordSeparator: '-',
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toCustomCase(null, options)).toBe(expectedOutput);
    expect(toCustomCase(undefined, options)).toBe(expectedOutput);
  });

  it('should handle empty string input with prefix and suffix', () => {
    const inputStr = '';
    const options: CustomCaseOptions = {
      wordCasing: 'all-lower',
      wordSeparator: '-',
      prefix: 'start-',
      suffix: '-end',
    };
    const expectedOutput = 'start--end';

    expect(toCustomCase(inputStr, options)).toBe(expectedOutput);
  });
});

describe('toCasing', () => {
  test('converts to camel case', () => {
    expect(toCasing('hello world', 'camel')).toBe('helloWorld');
    expect(toCasing('Hello-world_test', 'camel')).toBe('helloWorldTest');
    expect(toCasing('Hello-WORLD', { casing: 'camel', keepOriginalCase: true })).toBe('helloWORLD');
  });

  test('converts to pascal case', () => {
    expect(toCasing('hello world', 'pascal')).toBe('HelloWorld');
    expect(toCasing('Hello-world_test', 'pascal')).toBe('HelloWorldTest');
    expect(toCasing('hello-WORLD', { casing: 'pascal', keepOriginalCase: true })).toBe(
      'HelloWORLD'
    );
  });

  test('converts to kebab case', () => {
    expect(toCasing('hello world', 'kebab')).toBe('hello-world');
    expect(toCasing('HelloWorldTest', 'kebab')).toBe('hello-world-test');
    expect(toCasing('HELLO_WORLD', { casing: 'kebab', wordCasing: 'all-upper' })).toBe(
      'HELLO-WORLD'
    );
  });

  test('converts to snake case', () => {
    expect(toCasing('hello world', 'snake')).toBe('HELLO_WORLD');
    expect(toCasing('HelloWorldTest', 'snake')).toBe('HELLO_WORLD_TEST');
    expect(toCasing('hello-world', { casing: 'snake', wordCasing: 'all-lower' })).toBe(
      'hello_world'
    );
  });

  test('converts to custom case', () => {
    expect(
      toCasing('hello world', { casing: 'custom', wordSeparator: '.', wordCasing: 'first-upper' })
    ).toBe('Hello.World');
    expect(
      toCasing('HelloWorldTest', {
        casing: 'custom',
        wordSeparator: '#',
        wordCasing: 'first-lower',
      })
    ).toBe('hello#world#test');
  });

  test('converts to word casings', () => {
    expect(toCasing('hello world', 'all-lower')).toBe('helloworld');
    expect(toCasing('Hello world', 'all-upper')).toBe('HELLOWORLD');
    expect(toCasing('hello world', 'first-upper')).toBe('Helloworld');
    expect(toCasing('hello world', 'first-lower-alternating')).toBe('hElLoWoRlD');
  });
});
