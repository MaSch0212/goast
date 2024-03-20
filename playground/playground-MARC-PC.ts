import * as util from 'util';
import path from 'path';
import YAML from 'yaml';
import fs from 'fs-extra';
import { ApiSchema, OpenApiGenerator, OpenApiParser, spliceString } from '@goast/core';
import { TypeScriptClientsGenerator, TypeScriptModelsGenerator } from '@goast/typescript';

export async function main(): Promise<void> {
  // const x = await new OpenApiGenerator({ outputDir: 'out' })
  //   .useType(TypeScriptModelsGenerator)
  //   .useType(TypeScriptClientsGenerator)
  //   .parseAndGenerateFromDir('.openapi');
  // console.log(x);

  const x = await new OpenApiParser().parseApisAndTransform('test/openapi-files/v3/discriminated-schemas.yml');

  for (const schema of x.schemas) {
    (schema.$src as any).document = inspectCountMsg(schema.$src.document);
    (schema.$src as any).component = inspectCountMsg(schema.$src.component);
    (schema.$src as any).originalComponent = inspectCountMsg(schema.$src.originalComponent);

    for (const m in schema.discriminator?.mapping ?? {}) {
      (schema.discriminator.mapping as any)[m] = schema.discriminator.mapping[m].id;
    }

    if ('properties' in schema) {
      for (const p of schema.properties?.keys() ?? []) {
        const prop = schema.properties.get(p);
        (prop as any).schema = prop.schema.id;
      }
    }
    if ('allOf' in schema) {
      (schema as any).allOf = schema.allOf.map((s) => s.id);
    }
    if ('anyOf' in schema) {
      (schema as any).anyOf = schema.anyOf.map((s) => s.id);
    }
    if ('oneOf' in schema) {
      (schema as any).oneOf = schema.oneOf.map((s) => s.id);
    }
    if ('inheritedSchemas' in schema) {
      (schema as any).inheritedSchemas = schema.inheritedSchemas.map((s) => s.id);
    }
    if (schema.$ref) {
      (schema as any).$ref = schema.$ref.id;
    }
  }

  let text = util.inspect(x, { depth: 1000, sorted: true }).replace(/<ref \*[0-9]+>\s/g, '');

  // let matchCounter = 0;
  // let currentBracket: { start: number; subCount: number; bracket: string } | null = null;
  // try {
  //   for (let i = 1; i < text.length; i++) {
  //     if (text[i] === currentBracket?.bracket[0]) {
  //       currentBracket.subCount++;
  //     } else if (text[i] === '{' && currentBracket === null) {
  //       currentBracket = { start: i, subCount: 0, bracket: '{}' };
  //     } else if (text[i] === '[' && currentBracket === null) {
  //       currentBracket = { start: i, subCount: 0, bracket: '[]' };
  //     } else if (text[i] === currentBracket?.bracket[1]) {
  //       if (currentBracket.subCount === 0) {
  //         let block = text.substring(currentBracket.start, i + 1);
  //         const matches = getRegexMatches(new RegExp(escapeRegExp(block), 'g'), text);
  //         const indentCount = /( *).$/.exec(block)?.[1].length ?? 0;
  //         if (indentCount > 0) {
  //           const indent = ' '.repeat(indentCount);
  //           block = block.replace(new RegExp(`\n${indent}`, 'g'), '\n');
  //         }
  //         if (matches.length > 1 && block.length > 100) {
  //           matchCounter++;
  //           for (let mi = matches.length - 1; mi >= 0; mi--) {
  //             const match = matches[mi];
  //             text = spliceString(text, match.index!, match[0].length, `<${matchCounter}>`);
  //           }

  //           text += `\n\n<${matchCounter}>: ${block}`;
  //         }
  //         i = currentBracket.start;
  //         currentBracket = null;
  //       } else {
  //         currentBracket.subCount--;
  //       }
  //     }
  //   }
  // } catch (e) {
  //   console.log(e);
  // }

  await fs.writeFile('out.txt', text);
}

function inspectCountMsg(obj: unknown): string {
  return `${util.inspect(obj, { depth: 1000 }).length} inspect chars`;
}

function escapeRegExp(string) {
  return string
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\r?\n/g, '\\n')
    .replace(/\s{2,}/g, '\\s*');
}

function getRegexMatches(regex: RegExp, text: string): RegExpMatchArray[] {
  const matches: RegExpMatchArray[] = [];
  let match;
  try {
    while ((match = regex.exec(text)) !== null) {
      matches.push(match);
    }
  } catch (e) {
    if (e.message.includes('Stack overflow')) {
      return [];
    }
    throw e;
  }
  return matches;
}
