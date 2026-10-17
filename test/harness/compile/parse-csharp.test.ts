import { describe, expect, it } from 'vitest';

import { parseCSharpDiagnostics } from './parse-csharp.ts';

describe('parseCSharpDiagnostics', () => {
  it('extracts file, position, code, and message, dropping the project suffix', () => {
    const line = '/output/csharp/m/v3/a/Pet.cs(12,34): error CS1002: ; expected [/work/u1/u1.csproj]';
    expect(parseCSharpDiagnostics(line)).toEqual([
      { file: '/output/csharp/m/v3/a/Pet.cs', line: 12, column: 34, message: 'CS1002: ; expected' },
    ]);
  });

  it('accepts the four-number range form', () => {
    expect(parseCSharpDiagnostics('/o/A.cs(1,2,3,4): error CS0103: The name x does not exist [/w/p.csproj]')).toEqual([
      { file: '/o/A.cs', line: 1, column: 2, message: 'CS0103: The name x does not exist' },
    ]);
  });

  it('ignores warnings and MSBuild noise', () => {
    const output = [
      'Restore complete (0.5s)',
      '/o/A.cs(1,1): warning CS8618: unused [/w/p.csproj]',
      'Build FAILED.',
      '    0 Warning(s)',
      '    1 Error(s)',
      'Time Elapsed 00:00:03.21',
      '',
    ].join('\n');
    expect(parseCSharpDiagnostics(output)).toEqual([]);
  });

  it('collapses an error MSBuild prints inline and again in the summary', () => {
    const line = '/o/A.cs(3,5): error CS0246: The type or namespace name Foo could not be found [/w/p.csproj]';
    expect(parseCSharpDiagnostics(`${line}\nBuild FAILED.\n${line}\n  ${line}\n`)).toHaveLength(1);
  });

  it('keeps the same error in two different projects', () => {
    const output = [
      '/o/A.cs(3,5): error CS0246: missing [/w/p1/p1.csproj]',
      '/o/A.cs(3,5): error CS0246: missing [/w/p2/p2.csproj]',
    ].join('\n');
    // Same shape, two projects: the project is not in the result, but both were real failures. They
    // are only collapsed when the project matches.
    expect(parseCSharpDiagnostics(output)).toHaveLength(2);
  });

  it('reports a positionless error against its project file', () => {
    const line = '/work/u1/u1.csproj : error NU1101: Unable to find package Foo. No packages exist with this id';
    expect(parseCSharpDiagnostics(line)).toEqual([
      {
        file: '/work/u1/u1.csproj',
        line: null,
        column: null,
        message: 'NU1101: Unable to find package Foo. No packages exist with this id',
      },
    ]);
  });

  it('prefers the bracketed project over a tool name for a positionless error', () => {
    expect(parseCSharpDiagnostics('CSC : error CS5001: Program does not contain a Main [/work/u1/u1.csproj]')).toEqual([
      { file: '/work/u1/u1.csproj', line: null, column: null, message: 'CS5001: Program does not contain a Main' },
    ]);
  });

  it('keeps a Windows-style CRLF log parseable', () => {
    expect(parseCSharpDiagnostics('/o/A.cs(1,2): error CS1002: ; expected [/w/p.csproj]\r\n')).toHaveLength(1);
  });
});
