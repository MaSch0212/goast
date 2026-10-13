/**
 * `k6-clients` output imports FormData from a URL, which is how k6 loads its extras and which `tsc`
 * cannot resolve. Declaring the module keeps the import from becoming a resolution error that would
 * bury every real diagnostic in the unit. The shape is deliberately minimal — only what the generated
 * request builder uses — so a change in how the generator uses FormData surfaces as a type error
 * rather than passing against an `any`.
 */
declare module 'https://jslib.k6.io/formdata/0.0.2/index.js' {
  export class FormData {
    append(name: string, value: unknown, filename?: string): void;
    body(): ArrayBuffer;
    readonly boundary: string;
  }
}
