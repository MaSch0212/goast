# Tier 1 Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize every existing test in the repo to one convention, then add unit coverage for `@goast/core`'s
untested `parse/`, `transform/`, `collect/` and `codegen/` directories plus the six untested AST node builders in
`@goast/kotlin` and `@goast/typescript`.

**Architecture:** Two halves that must run in order. The convention pass rewrites ~72 existing test files in place, one
task per package, and retires a test-harness helper whose EOL handling the convention makes dead. The coverage half then
adds new `*.test.ts` files colocated beside their subjects, following the convention the first half established. New
core tests build faithful `Deref` inputs through the real `createDerefProxy`, using a fixture module extracted from the
one existing test that already solves that problem.

**Tech Stack:** Deno 2.x, `@std/testing/bdd` (`describe`/`it`/`beforeEach`), `@std/expect`, `@goast/test-harness`.

## Global Constraints

- Deno and Docker are the only prerequisites. Nothing in this phase needs Docker; nothing in this phase may start a
  container.
- `it` everywhere. No `test(` from `@std/testing/bdd`.
- `import { expect } from '@std/expect'`. Never `'@std/expect/expect'`.
- Literal `\n` in expected strings. Never `EOL` from `node:os`. Tests must not depend on host OS line endings.
  **One carve-out, added during execution:** a test whose *subject* is that a default equals the host line ending may
  import `EOL` from `node:os`, because that is the only way to assert it without comparing the implementation to itself.
  `SourceBuilder` and `StringBuilder` default `newLine` to `os.EOL` in production code, so
  `expect(new SourceBuilder().options.newLine).toBe(defaultSourceBuilderOptions.newLine)` is definitionally true and
  passes even when the default is wrong — verified by mutation during Task 2's review. Every *other* expectation pins
  `{ newLine: '\n' }` on the builder under test and compares against a literal `\n`. The rule's purpose is that a test's
  expectations must not accidentally depend on the host; where host-dependence is the thing being tested, the import is
  correct and must carry a comment saying so.
- One top-level `describe` per exported symbol, in a file colocated as `<symbol-file>.test.ts`.
- No `stub(fs, ...)`. Real IO against a temp directory where IO is unavoidable.
- `deno fmt --check` and `deno lint` must pass before every commit.
- Never edit anything under `test/output/`, `test/specs/`, or `test/compile/`. This phase does not touch the corpus or
  its snapshots. If a change to production code under `packages/` would alter generated output, that is out of scope —
  record it (Task 12) rather than fixing it.
- Tier 2 and tier 3 snapshots must remain byte-identical. `deno task test:output:check` is the gate for that.

## Established facts (measured, do not re-derive)

- Existing test files: `packages/core` 15, `packages/kotlin` 23, `packages/typescript` 34, `test/harness` 18.
- **`test/harness`'s 18 test files are already fully compliant** — zero `@std/expect/expect`, zero `node:os`, every file
  has a top-level `describe`. There is no harness convention sweep. Only `test/harness/string.utils.ts` changes.
- Convention violations: 45 files import `'@std/expect/expect'`; 41 files import `EOL` from `'node:os'`; 4 files use
  `test(` and all four are in `packages/core`
  (`collect/helpers.test.ts`, `transform/helpers.test.ts`, `transform/transform-schema.test.ts`,
  `utils/common.utils.test.ts`); 9 files have no top-level `describe` at all and all nine are in
  `packages/typescript/src/ast/nodes/` (`constructor`, `doc-tag`, `doc`, `function-type`, `method`, `object-type`,
  `object`, `type-alias`, `variable`).
- `stub(fs` appears in zero test files. That convention rule is already satisfied; nothing to do.
- **`normalizeEOL` is called 23 times and every single call passes an indent count** — `normalizeEOL(8)(...)`. Its
  `normalizeEOL(str: string): string` overload has **zero callers**. See Task 1.
- `test/harness` does **not** currently import `@goast/core`. Task 6 adds that edge; its Step 1 verifies the npm build
  still works and states the fallback.
- **There is no version-detection code in `@goast/core`.** The spec's tier-1 paragraph lists "version detection" as a
  `parse/` concern; grep finds only type declarations and unrelated comments. Swagger 2 versus OpenAPI 3 is handled
  *structurally and implicitly* in `collect/collector.ts` — `document.definitions` beside `document.components.schemas`,
  `document.parameters`, `document.responses` — never by reading `document.openapi` or `document.swagger`. Task 8 tests
  that structural branching. Do not write tests for a version detector; there isn't one.

---

## Part 1 — the convention pass

### Task 1: `dedent` in the test harness

**Files:**

- Modify: `test/harness/string.utils.ts`
- Create: `test/harness/string.utils.test.ts`

**Interfaces:**

- Produces: `dedent(indentCharCount: number): (str: string) => string`, exported from `@goast/test-harness`. Strips
  exactly `indentCharCount` leading spaces from every line. Performs **no** line-ending conversion.
- `normalizeEOL` stays exported and unchanged in this task so that Tasks 2-4 can migrate call sites one package at a
  time with a green suite after each. Task 4 deletes it.

The current file is:

```ts
import { EOL } from 'node:os';

function _normalizeEOL(str: string, indentCharCount?: number): string {
  let result = str.replace(/\r/gm, '').replace(/\n/g, EOL);
  if (indentCharCount !== undefined) {
    result = result.replace(new RegExp(`^ {${indentCharCount}}`, 'gm'), '');
  }
  return result;
}

export function normalizeEOL(str: string): string;
export function normalizeEOL(indentCharCount: number): (str: string) => string;
export function normalizeEOL(arg1: string | number): string | ((str: string) => string) {
  if (typeof arg1 === 'string') {
    return _normalizeEOL(arg1);
  }
  return (str: string) => _normalizeEOL(str, arg1);
}
```

It does two unrelated jobs. The `\n` → `EOL` conversion is what the convention removes. The `^ {n}` strip is a dedenter
that 23 call sites genuinely need, because they compare against indented template literals. The spec says
"`normalizeEOL` is removed where it exists only to paper over that" — here the honest reading is: the EOL half goes, the
dedent half stays under a name that says what it does.

- [ ] **Step 1: Write the failing test**

Create `test/harness/string.utils.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { dedent } from './string.utils.ts';

describe('dedent', () => {
  it('strips exactly the requested number of leading spaces from every line', () => {
    expect(dedent(4)('    a\n    b\n')).toBe('a\nb\n');
  });

  it('leaves deeper indentation intact beyond the stripped prefix', () => {
    expect(dedent(4)('    a\n        b\n')).toBe('a\n    b\n');
  });

  it('leaves a line shorter than the prefix untouched rather than trimming what it can', () => {
    expect(dedent(4)('  a\n    b\n')).toBe('  a\nb\n');
  });

  it('leaves an empty line empty', () => {
    expect(dedent(4)('    a\n\n    b\n')).toBe('a\n\nb\n');
  });

  it('does not convert line endings — a literal \\n stays a literal \\n', () => {
    expect(dedent(0)('a\nb')).toBe('a\nb');
  });

  it('does not strip tabs, only spaces', () => {
    expect(dedent(2)('\t\ta\n  b\n')).toBe('\t\ta\nb\n');
  });
});
```

The fifth case is the point of the whole task: on Windows the old helper turned `\n` into `\r\n`, and that is the
behaviour the convention forbids. Assert it explicitly so a future reinstatement fails.

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/string.utils.test.ts`
Expected: FAIL — `dedent` is not exported.

- [ ] **Step 3: Add `dedent`**

Rewrite `test/harness/string.utils.ts` to:

```ts
import { EOL } from 'node:os';

/**
 * Strips `indentCharCount` leading spaces from every line.
 *
 * Tests compare generated output against indented template literals, so the literal carries the
 * surrounding code's indentation and the expectation does not. This removes exactly that prefix and
 * nothing else: a line indented less than the prefix is left alone rather than partially trimmed, so a
 * mis-specified count shows up as a failing test instead of silently eating real leading whitespace.
 *
 * It deliberately does **not** touch line endings. The predecessor (`normalizeEOL` below) rewrote `\n`
 * to the host's `EOL`, which made every expectation depend on which OS ran the suite; the convention is
 * that tests use literal `\n` everywhere.
 */
export function dedent(indentCharCount: number): (str: string) => string {
  const prefix = new RegExp(`^ {${indentCharCount}}`, 'gm');
  return (str: string) => str.replace(prefix, '');
}

function _normalizeEOL(str: string, indentCharCount?: number): string {
  let result = str.replace(/\r/gm, '').replace(/\n/g, EOL);
  if (indentCharCount !== undefined) {
    result = result.replace(new RegExp(`^ {${indentCharCount}}`, 'gm'), '');
  }
  return result;
}

export function normalizeEOL(str: string): string;
export function normalizeEOL(indentCharCount: number): (str: string) => string;
export function normalizeEOL(arg1: string | number): string | ((str: string) => string) {
  if (typeof arg1 === 'string') {
    return _normalizeEOL(arg1);
  }
  return (str: string) => _normalizeEOL(str, arg1);
}
```

`dedent(0)` produces the regex `^ {0}`, which matches an empty string at every line start and replaces it with an empty
string — a no-op, which is what the fifth test asserts. Do not special-case it.

- [ ] **Step 4: Run it and watch it pass**

Run: `deno test -A test/harness/string.utils.test.ts`
Expected: PASS, 6 steps.

`test/harness/mod.ts:7` already does `export * from './string.utils.ts';`, so `dedent` is exported from
`@goast/test-harness` with no barrel change. Confirm with:

Run: `deno eval "import { dedent } from '@goast/test-harness'; console.log(typeof dedent)"`
Expected: `function`

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint && deno test -A test/harness
git add test/harness/string.utils.ts test/harness/string.utils.test.ts
git commit -m "test(harness): add dedent, splitting indent stripping from EOL rewriting"
```

---

### Task 2: Convention sweep — `packages/core`

**Files:**

- Modify: all 15 `*.test.ts` files under `packages/core/src/`

**Interfaces:**

- Consumes: `dedent` from `@goast/test-harness` (Task 1), if any core test uses `normalizeEOL`.

Find the files with:

```bash
find packages/core/src -name '*.test.ts' | sort
```

Apply every rule below to every file. Rules that do not apply to a file are not a problem — the sweep is per package,
not per rule.

- [ ] **Step 1: Fix the `@std/expect` import**

Replace `import { expect } from '@std/expect/expect';` with `import { expect } from '@std/expect';`.

`deno.json`'s `imports` maps `"@std/expect": "jsr:@std/expect@^1.0.5"` and has no `@std/expect/expect` entry, so the
subpath resolves through the package's own exports. Both work; the convention picks one.

- [ ] **Step 2: Replace `test(` with `it(`**

Four core files use `test(`: `collect/helpers.test.ts`, `transform/helpers.test.ts`, `transform/transform-schema.test.ts`,
`utils/common.utils.test.ts`. Change both the import (`import { describe, test } from '@std/testing/bdd'` →
`import { describe, it } from '@std/testing/bdd'`) and every call site. Watch for `test.only`/`test.skip` — convert to
`it.only`/`it.skip`, and if you find either, remove the modifier entirely and say so in your report: a committed
`.only` silently disables the rest of its file.

- [ ] **Step 3: Replace `EOL` with a literal `\n`**

Remove `import { EOL } from 'node:os';` and rewrite expectations. A template literal like:

```ts
expect(builder.toString(false)).toBe(`class Foo${EOL}`);
```

becomes:

```ts
expect(builder.toString(false)).toBe('class Foo\n');
```

Prefer a single-quoted string with `\n` escapes when the expectation is one line. Keep a template literal when it spans
lines, and let the literal carry real newlines.

- [ ] **Step 4: Migrate `normalizeEOL` to `dedent`**

Every call is `normalizeEOL(n)(...)`. Replace with `dedent(n)(...)` and update the import from `@goast/test-harness`.
Because `dedent` no longer rewrites `\n` to the host `EOL`, an expectation that was passing on Windows only because both
sides got converted will now fail — that is the convention working. Fix the expectation, never reinstate the
conversion.

- [ ] **Step 5: Ensure one top-level `describe` per exported symbol**

No core test file is missing a `describe`, but verify rather than assume:

```bash
for f in $(find packages/core/src -name '*.test.ts'); do grep -q "^describe(" "$f" || echo "MISSING: $f"; done
```

Expected: no output. If a file does appear, wrap its bare `it`s in `describe('<exportedSymbol>', () => { ... })` and
move any module-level `beforeEach` inside it.

- [ ] **Step 6: Verify no rule was missed**

```bash
grep -rn "@std/expect/expect" packages/core && echo "STILL PRESENT"
grep -rn "from 'node:os'" packages/core --include='*.test.ts' && echo "STILL PRESENT"
grep -rnE "^\s*test\(" packages/core --include='*.test.ts' && echo "STILL PRESENT"
```

Expected: all three print nothing (each `grep` exits 1, so `&&` does not fire).

- [ ] **Step 7: Run the suite and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core
git add packages/core
git commit -m "test(core): normalize the existing tests to one convention"
```

Record the before/after test counts in your report. They must be identical — this task changes how tests are written,
never what they assert. A changed count means a test was dropped or a `describe` swallowed one.

---

### Task 3: Convention sweep — `packages/kotlin`

**Files:**

- Modify: all 23 `*.test.ts` files under `packages/kotlin/src/`

**Interfaces:**

- Consumes: `dedent` from `@goast/test-harness` (Task 1). Six kotlin files use `normalizeEOL`:
  `ast/nodes/{class,constructor,enum-value,enum,interface,property}.test.ts`.

Apply the identical five rules from Task 2, Steps 1 through 5, to `packages/kotlin/src` instead of
`packages/core/src`. They are repeated here rather than cross-referenced because you may be reading this task alone:

- [ ] **Step 1: Fix the `@std/expect` import** — `'@std/expect/expect'` → `'@std/expect'`.

- [ ] **Step 2: Replace `test(` with `it(`** — no kotlin file uses `test(`; verify with
      `grep -rnE "^\s*test\(" packages/kotlin --include='*.test.ts'` and expect no output.

- [ ] **Step 3: Replace `EOL` with a literal `\n`** — remove `import { EOL } from 'node:os';` and inline `\n`.
      For example, in `ast/nodes/class.test.ts`:

```ts
expect(builder.toString(false)).toBe(`class Foo(x: Int) {${EOL}    init {${EOL}        println(x)${EOL}    }${EOL}}${EOL}`);
```

becomes

```ts
expect(builder.toString(false)).toBe('class Foo(x: Int) {\n    init {\n        println(x)\n    }\n}\n');
```

- [ ] **Step 4: Migrate `normalizeEOL(n)` to `dedent(n)`** in the six files named above.

- [ ] **Step 5: Ensure one top-level `describe` per exported symbol**

```bash
for f in $(find packages/kotlin/src -name '*.test.ts'); do grep -q "^describe(" "$f" || echo "MISSING: $f"; done
```

Expected: no output.

- [ ] **Step 6: Verify no rule was missed**

```bash
grep -rn "@std/expect/expect" packages/kotlin && echo "STILL PRESENT"
grep -rn "from 'node:os'" packages/kotlin --include='*.test.ts' && echo "STILL PRESENT"
```

Expected: both print nothing.

- [ ] **Step 7: Run the suite and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/kotlin
git add packages/kotlin
git commit -m "test(kotlin): normalize the existing tests to one convention"
```

Report before/after test counts; they must match.

---

### Task 4: Convention sweep — `packages/typescript`, and retire `normalizeEOL`

**Files:**

- Modify: all 34 `*.test.ts` files under `packages/typescript/src/`
- Modify: `test/harness/string.utils.ts`
- Modify: `test/harness/string.utils.test.ts`

**Interfaces:**

- Consumes: `dedent` from `@goast/test-harness` (Task 1). Six typescript files use `normalizeEOL`:
  `ast/nodes/{class,constructor,function,interface,method,tuple}.test.ts`.
- **This task must run after Tasks 2 and 3.** Its final steps delete `normalizeEOL`, which requires every other
  package's call sites to be migrated first. If `packages/core` or `packages/kotlin` still references it, stop and
  report BLOCKED rather than deleting it.

- [ ] **Step 1: Fix the `@std/expect` import** — `'@std/expect/expect'` → `'@std/expect'`.

- [ ] **Step 2: Replace `test(` with `it(`** — verify none with
      `grep -rnE "^\s*test\(" packages/typescript --include='*.test.ts'`; expect no output.

- [ ] **Step 3: Replace `EOL` with a literal `\n`** — remove `import { EOL } from 'node:os';` and inline `\n`.

- [ ] **Step 4: Migrate `normalizeEOL(n)` to `dedent(n)`** in the six files named above.

- [ ] **Step 5: Add the nine missing `describe` blocks**

These nine files have no top-level `describe` — they use bare `it` with a module-level `let builder` and `beforeEach`:

```
packages/typescript/src/ast/nodes/constructor.test.ts
packages/typescript/src/ast/nodes/doc-tag.test.ts
packages/typescript/src/ast/nodes/doc.test.ts
packages/typescript/src/ast/nodes/function-type.test.ts
packages/typescript/src/ast/nodes/method.test.ts
packages/typescript/src/ast/nodes/object-type.test.ts
packages/typescript/src/ast/nodes/object.test.ts
packages/typescript/src/ast/nodes/type-alias.test.ts
packages/typescript/src/ast/nodes/variable.test.ts
```

`method.test.ts` currently begins:

```ts
import { beforeEach, it } from '@std/testing/bdd';
// ...
let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});
```

Wrap the whole body in a `describe` named for the exported symbol the file tests — `tsMethod` here — and move the `let`
and `beforeEach` inside it, matching the shape of an already-compliant sibling such as
`packages/kotlin/src/ast/nodes/argument.test.ts`:

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';
// ...
describe('tsMethod', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    builder = new TypeScriptFileBuilder();
  });

  it('...', () => { /* unchanged */ });
});
```

Take the `describe` name from the file's own primary import — `tsConstructor`, `tsDocTag`, `tsDoc`, `tsFunctionType`,
`tsMethod`, `tsObjectType`, `tsObject`, `tsTypeAlias`, `tsVariable`. Add `describe` to the `@std/testing/bdd` import
list. Do not change a single assertion.

- [ ] **Step 6: Verify the typescript package**

```bash
grep -rn "@std/expect/expect" packages/typescript && echo "STILL PRESENT"
grep -rn "from 'node:os'" packages/typescript --include='*.test.ts' && echo "STILL PRESENT"
for f in $(find packages/typescript/src -name '*.test.ts'); do grep -q "^describe(" "$f" || echo "MISSING: $f"; done
```

Expected: no output from any of the three.

Run: `deno fmt --check && deno lint && deno test -A packages/typescript`
Expected: PASS, with the same test count as before the sweep.

- [ ] **Step 7: Commit the sweep**

```bash
git add packages/typescript
git commit -m "test(typescript): normalize the existing tests to one convention"
```

- [ ] **Step 8: Prove `normalizeEOL` has no callers left**

```bash
grep -rn "normalizeEOL" packages test --include='*.ts'
```

Expected: matches only inside `test/harness/string.utils.ts` itself. If anything else appears, a sweep is incomplete —
fix it here and say so, or report BLOCKED if it is outside this plan's scope.

- [ ] **Step 9: Delete `normalizeEOL` and the `node:os` import**

`test/harness/string.utils.ts` becomes exactly:

```ts
/**
 * Strips `indentCharCount` leading spaces from every line.
 *
 * Tests compare generated output against indented template literals, so the literal carries the
 * surrounding code's indentation and the expectation does not. This removes exactly that prefix and
 * nothing else: a line indented less than the prefix is left alone rather than partially trimmed, so a
 * mis-specified count shows up as a failing test instead of silently eating real leading whitespace.
 *
 * It deliberately does **not** touch line endings, and there is no helper here that does. Its
 * predecessor (`normalizeEOL`) rewrote `\n` to the host's `EOL`, which made every expectation depend on
 * which OS ran the suite — two tests could pass on Windows and fail on Linux for reasons unrelated to
 * what they asserted. Tests use literal `\n` everywhere instead.
 */
export function dedent(indentCharCount: number): (str: string) => string {
  const prefix = new RegExp(`^ {${indentCharCount}}`, 'gm');
  return (str: string) => str.replace(prefix, '');
}
```

Note the file no longer imports from `node:os` at all — that import was the last thing making a *source* file in the
harness OS-dependent.

- [ ] **Step 10: Verify and commit the retirement**

```bash
deno fmt --check && deno lint
deno test -A packages/core packages/kotlin packages/typescript test/harness
grep -rn "node:os" test/harness && echo "STILL PRESENT"
```

Expected: suite passes; the `grep` prints nothing.

```bash
git add test/harness/string.utils.ts test/harness/string.utils.test.ts
git commit -m "test(harness): retire normalizeEOL now that nothing converts line endings"
```

- [ ] **Step 11: Confirm tiers 2 and 3 are untouched**

The convention pass must not have altered any snapshot.

```bash
deno task test:output:check
git status --short
```

Expected: passes; `git status` clean. If a snapshot changed, a test file edit reached production code — revert that part
and report it.

---

## Part 2 — new coverage

### Task 5: The six untested AST node builders

**Files:**

- Create: `packages/kotlin/src/ast/nodes/collection-literal.test.ts`
- Create: `packages/kotlin/src/ast/nodes/lambda.test.ts`
- Create: `packages/kotlin/src/ast/nodes/lambda-type.test.ts`
- Create: `packages/typescript/src/ast/nodes/call.test.ts`
- Create: `packages/typescript/src/ast/nodes/lookup-type.test.ts`
- Create: `packages/typescript/src/ast/nodes/typeof.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks except the convention. Follow
  `packages/kotlin/src/ast/nodes/argument.test.ts` exactly for shape — `describe` named after the builder function, a
  `let builder` and `beforeEach` inside it, `builder.append(node)` then
  `expect(builder.toString(false)).toBe(...)`.
- Produces: nothing other tasks consume.

These six are the only AST node builders in either package without a sibling test; every other node has one. Each
builder also has an `inject` option set, and the existing tests all pin injections with `║b║`-style sentinels — keep
that convention, because injection points are part of each node's contract and are otherwise untested.

- [ ] **Step 1: Write `collection-literal.test.ts`**

`KtCollectionLiteral.onWrite` renders `[...]` and goes multiline when `elements.length > 2`, with `',\n'` as the
separator instead of `', '`. `Injects` is `never`, so there are no injection points to pin.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktCollectionLiteral } from './collection-literal.ts';

describe('ktCollectionLiteral', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('writes an empty literal for no elements', () => {
    builder.append(ktCollectionLiteral([]));
    expect(builder.toString(false)).toBe('[]');
  });

  it('writes up to two elements on one line', () => {
    builder.append(ktCollectionLiteral(['1', '2']));
    expect(builder.toString(false)).toBe('[1, 2]');
  });

  it('breaks to multiple lines at three elements', () => {
    builder.append(ktCollectionLiteral(['1', '2', '3']));
    expect(builder.toString(false)).toBe(dedent(6)(
      `[
          1,
          2,
          3,
      ]`,
    ));
  });

  it('drops nullish elements before counting, so three entries with a null stay on one line', () => {
    builder.append(ktCollectionLiteral(['1', null, '2']));
    expect(builder.toString(false)).toBe('[1, 2]');
  });

  it('treats a nullish element list as empty', () => {
    builder.append(ktCollectionLiteral(null));
    expect(builder.toString(false)).toBe('[]');
  });
});
```

The third and fourth cases together are the whole reason this file is worth writing: `elements` is filtered with
`notNullish` **before** `length > 2` is evaluated, so nullish entries change layout, not just content. Run the
multiline case first and paste the builder's real output into the expectation — `parenthesize` with `multiline: true`
controls the exact indentation and trailing separator, and guessing it wastes a cycle. If the real output has no
trailing comma after `3`, use what it actually produces and keep the test.

- [ ] **Step 2: Run it**

Run: `deno test -A packages/kotlin/src/ast/nodes/collection-literal.test.ts`
Expected: PASS, 5 steps.

- [ ] **Step 3: Write `lambda.test.ts`**

`KtLambda` renders `{ ... }`. `singleline` is forced true when `body` is absent. With arguments it emits
` <args> ->`. Injects are `arguments` and `body`, giving `beforeArguments`/`afterArguments`/`beforeBody`/`afterBody`.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktLambda } from './lambda.ts';

describe('ktLambda', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('writes an empty lambda when there is no body', () => {
    builder.append(ktLambda(null, null));
    expect(builder.toString(false)).toBe('{ }');
  });

  it('writes arguments followed by an arrow', () => {
    builder.append(ktLambda(['a', 'b'], 'a + b', { singleline: true }));
    expect(builder.toString(false)).toBe('{ a, b -> a + b }');
  });

  it('puts the body on its own line unless singleline is set', () => {
    builder.append(ktLambda(['a'], 'println(a)'));
    expect(builder.toString(false)).toBe('{ a ->\n    println(a)\n}');
  });

  it('renders injections around the arguments and the body', () => {
    builder.append(
      ktLambda(['a'], 'x', {
        singleline: true,
        inject: { beforeArguments: '║ba║', afterArguments: '║aa║', beforeBody: '║bb║', afterBody: '║ab║' },
      }),
    );
    expect(builder.toString(false)).toBe('{ ║ba║a║aa║ -> ║bb║x║ab║ }');
  });
});
```

Run each expectation and use the builder's real output. `ensureCurrentLineEmpty` and the `isCurrentLineEmpty` guard
decide the exact trailing whitespace, and those are behaviours to record, not to predict.

- [ ] **Step 4: Write `lambda-type.test.ts`**

`KtLambdaType` renders `(params) -> returnType`, prefixed by `suspend ` when `suspend` is true and by `Receiver.` when
`extensionFor` is set. Empty parameters render a literal `()`; non-empty go through `ktParameter.write`. Injects are
`extensionFor`, `params` and `returnType`.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktLambdaType } from './lambda-type.ts';

describe('ktLambdaType', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('writes an empty parameter list as ()', () => {
    builder.append(ktLambdaType([], 'Unit'));
    expect(builder.toString(false)).toBe('() -> Unit');
  });

  it('writes parameter types', () => {
    builder.append(ktLambdaType(['Int', 'String'], 'Boolean'));
    expect(builder.toString(false)).toBe('(Int, String) -> Boolean');
  });

  it('prefixes suspend', () => {
    builder.append(ktLambdaType([], 'Unit', { suspend: true }));
    expect(builder.toString(false)).toBe('suspend () -> Unit');
  });

  it('writes an extension receiver before the parameters', () => {
    builder.append(ktLambdaType(['Int'], 'Unit', { extensionFor: 'Foo' }));
    expect(builder.toString(false)).toBe('Foo.(Int) -> Unit');
  });

  it('treats a nullish parameter list as empty', () => {
    builder.append(ktLambdaType(null, 'Unit'));
    expect(builder.toString(false)).toBe('() -> Unit');
  });

  it('renders injections around the receiver, parameters and return type', () => {
    builder.append(
      ktLambdaType(['Int'], 'Unit', {
        extensionFor: 'Foo',
        inject: {
          beforeExtensionFor: '║be║',
          afterExtensionFor: '║ae║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeReturnType: '║br║',
          afterReturnType: '║ar║',
        },
      }),
    );
    expect(builder.toString(false)).toBe('║be║Foo║ae║.║bp║(Int)║ap║ -> ║br║Unit║ar║');
  });
});
```

- [ ] **Step 5: Write `call.test.ts`**

`TsCall` joins `path` with `.` and appends arguments through `tsArgument.write` — but **only when `arguments` is
non-null**. `createCall` passes `args` straight through, so omitting it yields `null` and no parentheses at all, while
passing `[]` yields `()`. That distinction is the most important thing in the file. `Injects` is `never`.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsCall } from './call.ts';

describe('tsCall', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    builder = new TypeScriptFileBuilder();
  });

  it('accepts a single path segment without an array', () => {
    builder.append(tsCall('foo', []));
    expect(builder.toString(false)).toBe('foo()');
  });

  it('joins a path with dots', () => {
    builder.append(tsCall(['a', 'b', 'c'], []));
    expect(builder.toString(false)).toBe('a.b.c()');
  });

  it('writes no parentheses at all when arguments are omitted', () => {
    builder.append(tsCall(['a', 'b']));
    expect(builder.toString(false)).toBe('a.b');
  });

  it('writes empty parentheses for an empty argument list', () => {
    builder.append(tsCall('foo', []));
    expect(builder.toString(false)).toBe('foo()');
  });

  it('writes arguments', () => {
    builder.append(tsCall('foo', ['1', "'x'"]));
    expect(builder.toString(false)).toBe("foo(1, 'x')");
  });

  it('drops nullish path segments and nullish arguments', () => {
    builder.append(tsCall(['a', null, 'b'], ['1', null]));
    expect(builder.toString(false)).toBe('a.b(1)');
  });
});
```

- [ ] **Step 6: Write `lookup-type.test.ts`**

`TsLookupType` renders `(type)[index]` — note the parentheses around the type, which `parenthesize('()')` always emits.
Injects are `type` and `index`.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsLookupType } from './lookup-type.ts';

describe('tsLookupType', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    builder = new TypeScriptFileBuilder();
  });

  it('parenthesizes the type and brackets the index', () => {
    builder.append(tsLookupType('Foo', "'bar'"));
    expect(builder.toString(false)).toBe("(Foo)['bar']");
  });

  it('renders injections around the type and the index', () => {
    builder.append(
      tsLookupType('Foo', "'bar'", {
        inject: { beforeType: '║bt║', afterType: '║at║', beforeIndex: '║bi║', afterIndex: '║ai║' },
      }),
    );
    expect(builder.toString(false)).toBe("(║bt║Foo║at║)[║bi║'bar'║ai║]");
  });
});
```

- [ ] **Step 7: Write `typeof.test.ts`**

`TsTypeof` renders `typeof <value>`. Injects is `value`.

```ts
import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsTypeof } from './typeof.ts';

describe('tsTypeof', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    builder = new TypeScriptFileBuilder();
  });

  it('prefixes the value with typeof', () => {
    builder.append(tsTypeof('foo'));
    expect(builder.toString(false)).toBe('typeof foo');
  });

  it('renders injections around the value', () => {
    builder.append(tsTypeof('foo', { inject: { beforeValue: '║bv║', afterValue: '║av║' } }));
    expect(builder.toString(false)).toBe('typeof ║bv║foo║av║');
  });
});
```

- [ ] **Step 8: Note the `createTypeof` export asymmetry**

`packages/typescript/src/ast/nodes/typeof.ts` exports **both** `createTypeof` and `tsTypeof`. Every sibling node keeps
its `create*` factory module-private and exports only the `Object.assign`ed builder. Check whether anything imports
`createTypeof`:

```bash
grep -rn "createTypeof" packages test --include='*.ts'
```

Do **not** change the export in this task — it is public API surface and removing it is a breaking change, not a test
change. Record what you found for Task 12.

- [ ] **Step 9: Run everything and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/kotlin packages/typescript
git add packages/kotlin/src/ast/nodes packages/typescript/src/ast/nodes
git commit -m "test(ast): cover the six untested node builders"
```

Report the exact output your expectations were built from wherever it differed from the code above, and say which
builder produced it. Those differences are the real contract.

---

### Task 6: The `Deref` fixture, and `parse/deref-proxy` coverage

**Files:**

- Create: `test/harness/deref.ts`
- Modify: `test/harness/mod.ts`
- Create: `packages/core/src/parse/deref-proxy.test.ts`
- Modify: `packages/core/src/transform/transform-schema.test.ts`

**Interfaces:**

- Produces, exported from `@goast/test-harness`:
  - `derefAt<T extends object>(path: string, value: T, ref?: Deref<T>): Deref<T>` — wraps `value` in a real
    `createDerefProxy` with `$src` of `{ file: 'test.yml', pos: { line: 0, col: 0 }, path, document: {} as
    Deref<OpenApiDocument>, originalComponent: value }`.
  - `derefSchemaAt<T extends object>(path: string, schema: T, ref?: Deref<T>): Deref<T>` — same, but first recurses
    into the nested schema keys `['allOf', 'anyOf', 'oneOf', 'not', 'items', 'prefixItems', 'properties']` so that
    nested schemas are themselves proxies at correct sub-paths.
- Consumed by Tasks 7, 8, 9, 10 and 11.

`packages/core/src/transform/transform-schema.test.ts` already contains exactly this logic as private `derefAt` and
`derefSchema` helpers with the comment "Builds a dereferenced schema the same way the parser does, so `$ref`
fallthrough behaves faithfully." Five more test files need it. Extract it rather than copying it five times.

- [ ] **Step 1: Check whether the harness may depend on `@goast/core`, and record the answer**

`test/harness` does not currently import `@goast/core`. `derefAt` needs `createDerefProxy` from it — using the real
proxy is the entire point, because a hand-rolled object would not reproduce `$ref` fallthrough, and that fallthrough is
what the tests exercise.

`packages/core`'s tests already import `@goast/test-harness`, so this creates a cycle between two workspace members
that exists only in test code. `scripts/build_npm.ts:144` lists `@goast/test-harness` in `dependenciesToRemove`, so it
is stripped at publish time.

Verify empirically before building on it:

```bash
deno task npm:test-harness
grep -n "goast/core" npm/test-harness/package.json
```

Expected: the build succeeds and `@goast/core` does **not** appear as a runtime dependency of the published harness.

**If either check fails**, do not force it. Fall back to colocating the fixture in `packages/core` at
`packages/core/src/parse/deref.test-utils.ts`, confirm `deno task npm:core` does not ship that file
(`ls npm/core/esm/parse/`), import it by relative path from the five consumers, and say in your report that you took
the fallback and why. Either outcome is fine; an unverified guess is not.

- [ ] **Step 2: Write the fixture's own test first**

Create `test/harness/deref.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from './deref.ts';

describe('derefAt', () => {
  it('records the path it was given in $src', () => {
    const value = derefAt('/components/schemas/Foo', { type: 'object' });
    expect(value.$src.path).toBe('/components/schemas/Foo');
    expect(value.$src.file).toBe('test.yml');
  });

  it('falls through to the $ref target for properties the value does not have', () => {
    const target = derefAt('/components/schemas/Target', { type: 'string', description: 'from target' });
    const value = derefAt('/components/schemas/Foo', { type: 'object' }, target);
    expect(value.description).toBe('from target');
    expect(value.type).toBe('object');
  });

  it('exposes the $ref target as $ref', () => {
    const target = derefAt('/components/schemas/Target', { type: 'string' });
    const value = derefAt('/components/schemas/Foo', {}, target);
    expect(value.$ref).toBe(target);
  });
});

describe('derefSchemaAt', () => {
  it('proxies nested schemas at their own sub-paths', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', {
      type: 'object',
      properties: { a: { type: 'string' } },
    });
    expect(schema.properties!.a.$src.path).toBe('/components/schemas/Foo/properties/a');
  });

  it('proxies each element of a nested schema array by index', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', {
      allOf: [{ type: 'string' }, { type: 'number' }],
    });
    expect(schema.allOf![1].$src.path).toBe('/components/schemas/Foo/allOf/1');
  });

  it('leaves a non-object nested value alone', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', { type: 'object', properties: undefined });
    expect(schema.properties).toBeUndefined();
  });
});
```

Run: `deno test -A test/harness/deref.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the fixture**

Create `test/harness/deref.ts`, moving the logic out of `transform-schema.test.ts` verbatim and generalizing `derefAt`
from `Deref<OpenApiSchema>` to any object:

```ts
import { createDerefProxy } from '@goast/core';
import type { Deref, OpenApiDocument } from '@goast/core';

const NESTED_SCHEMA_KEYS = ['allOf', 'anyOf', 'oneOf', 'not', 'items', 'prefixItems', 'properties'];

/**
 * Wraps `value` in a real deref proxy at `path`.
 *
 * Uses `createDerefProxy` rather than a hand-rolled object on purpose: the proxy's `get` handler falls
 * through to the `$ref` target for any property the value itself lacks, and that fallthrough is the
 * behaviour most transform code depends on. A plain object with a `$src` field would pass the shape
 * check and silently skip it.
 */
export function derefAt<T extends object>(path: string, value: T, ref?: Deref<T>): Deref<T> {
  return createDerefProxy(
    // deno-lint-ignore no-explicit-any
    value as any,
    {
      file: 'test.yml',
      pos: { line: 0, col: 0 },
      path,
      document: {} as Deref<OpenApiDocument>,
      // deno-lint-ignore no-explicit-any
      originalComponent: value as any,
    },
    // deno-lint-ignore no-explicit-any
    ref as any,
  ) as Deref<T>;
}

/**
 * Like {@link derefAt}, but recurses into nested schema keys first so that a nested schema is itself a
 * proxy at its own sub-path — the shape the parser produces, and the shape `$src.path`-keyed dedup in
 * the transformer and collector needs in order to behave as it does in production.
 */
// deno-lint-ignore no-explicit-any
export function derefSchemaAt<T extends Record<string, any>>(path: string, schema: T, ref?: Deref<T>): Deref<T> {
  for (const key of NESTED_SCHEMA_KEYS) {
    const value = schema[key];
    if (Array.isArray(value)) {
      schema[key] = value.map((x, i) => derefSchemaAt(`${path}/${key}/${i}`, x));
    } else if (value && typeof value === 'object') {
      schema[key] = key === 'properties'
        ? Object.fromEntries(
          Object.entries(value as Record<string, Record<string, unknown>>).map((
            [k, v],
          ) => [k, derefSchemaAt(`${path}/${key}/${k}`, v)]),
        )
        : derefSchemaAt(`${path}/${key}`, value);
    }
  }

  return derefAt(path, schema, ref);
}
```

Check that `createDerefProxy`, `Deref` and `OpenApiDocument` are all exported from `@goast/core`'s barrel:

```bash
deno eval "import { createDerefProxy } from '@goast/core'; console.log(typeof createDerefProxy)"
```

Expected: `function`. If it is not exported, import it by relative path from `packages/core/src/parse/` and note that
in your report — do **not** add it to core's public API to make a test convenient.

Add `export * from './deref.ts';` to `test/harness/mod.ts`, beside the existing exports.

- [ ] **Step 4: Run the fixture test**

Run: `deno test -A test/harness/deref.test.ts`
Expected: PASS, 6 steps.

- [ ] **Step 5: Switch `transform-schema.test.ts` to the shared fixture**

Delete its private `derefAt`, `derefSchema` and `nestedSchemaKeys`, import `derefSchemaAt` from
`@goast/test-harness`, and replace `derefSchema(name, schema, ref)` calls with
`derefSchemaAt(`/components/schemas/${name}`, schema, ref)`. Keep `createContext` where it is — Task 10 moves it.

Run: `deno test -A packages/core/src/transform/transform-schema.test.ts`
Expected: PASS with the **same** test count as before. This is the proof the extraction is behaviour-preserving; if a
test now fails, the fixture is not faithful and the fixture is wrong, not the test.

- [ ] **Step 6: Write `deref-proxy.test.ts`**

`createDerefProxy` has never been tested directly and its handler has five traps with non-obvious rules. Create
`packages/core/src/parse/deref-proxy.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt } from '@goast/test-harness';

import { createDerefProxy } from './deref-proxy.ts';
import type { OpenApiDocument, OpenApiSchema } from './openapi-types.ts';
import type { Deref } from './types.ts';

const src = (path: string) => ({
  file: 'test.yml',
  pos: { line: 0, col: 0 },
  path,
  document: {} as Deref<OpenApiDocument>,
  originalComponent: {} as OpenApiSchema,
});

describe('createDerefProxy', () => {
  it('exposes $src', () => {
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'));
    expect(proxy.$src.path).toBe('/a');
  });

  it('returns undefined for $ref when there is no ref', () => {
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'));
    expect(proxy.$ref).toBeUndefined();
  });

  it('prefers the target own property over the ref', () => {
    const ref = derefAt('/b', { type: 'string' as const });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.type).toBe('object');
  });

  it('falls through to the ref for a property the target lacks', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.description).toBe('from ref');
  });

  it('never inherits title from the ref, even though it inherits everything else', () => {
    const ref = derefAt('/b', { title: 'from ref', description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.title).toBeUndefined();
    expect(proxy.description).toBe('from ref');
  });

  it('lets a write shadow the target own property without mutating the target', () => {
    const target = { type: 'object' } as OpenApiSchema;
    const proxy = createDerefProxy(target, src('/a'));
    (proxy as { type?: string }).type = 'string';
    expect(proxy.type).toBe('string');
    expect(target.type).toBe('object');
  });

  it('accepts a write to $ref and reflects it in later reads', () => {
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'));
    const ref = derefAt('/b', { description: 'later' });
    (proxy as { $ref?: unknown }).$ref = ref;
    expect(proxy.description).toBe('later');
  });

  it('clears the ref when $ref is set to undefined', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    (proxy as { $ref?: unknown }).$ref = undefined;
    expect(proxy.description).toBeUndefined();
  });

  it('refuses a write to $src', () => {
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'));
    expect(() => {
      'use strict';
      (proxy as { $src?: unknown }).$src = null;
    }).toThrow();
  });

  it('reports a ref-only property as present via in', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    expect('description' in proxy).toBe(true);
  });

  it('lists target keys, ref keys, $ref and $src from ownKeys', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(Object.keys(proxy).sort()).toEqual(['$ref', '$src', 'description', 'type']);
  });
});
```

Two of these pin behaviour that looks like an oversight and is worth knowing precisely:

- The `title` exclusion is deliberate — `propertiesNotDerivedFromRef` exists so a `$ref`'d schema does not inherit the
  target's `title` as its own name.
- The `get` handler tests `this._overwrittenValues[prop] !== undefined` and then
  `target[prop] !== undefined`, so **writing `undefined` does not shadow anything** and a target property whose value
  is genuinely `undefined` falls through to the ref. If you can write a test that demonstrates this cleanly, add it and
  flag it for Task 12; if the assertion turns out to be wrong, say so with the evidence.

`Object.keys` on a proxy invokes `ownKeys` and then filters by `getOwnPropertyDescriptor`. The handler implements
`ownKeys` but not `getOwnPropertyDescriptor`, so keys that exist only on the ref may be filtered out and the last
expectation may need to be `Object.getOwnPropertyNames`-based or a subset check. **Run it, then write down what
actually happens** — and if ref-only keys are dropped from `Object.keys`, that is a finding for Task 12, not something
to paper over by weakening the test into `expect(...).toContain('type')`.

- [ ] **Step 7: Run it and commit**

```bash
deno fmt --check && deno lint
deno test -A packages/core test/harness
git add test/harness/deref.ts test/harness/deref.test.ts test/harness/mod.ts \
        packages/core/src/parse/deref-proxy.test.ts packages/core/src/transform/transform-schema.test.ts
git commit -m "test(core): cover createDerefProxy and share the deref fixture"
```

---

### Task 7: `parse/parser.ts`

**Files:**

- Create: `packages/core/src/parse/parser.test.ts`

**Interfaces:**

- Consumes: nothing from the harness fixture — this task builds real files on disk, because `OpenApiParser` reads them.
- Produces: nothing other tasks consume.

`OpenApiParser` is the only public entry point in `parse/` and has no tests. It does real IO, so this test writes YAML
into a temp directory and reads it back. That is consistent with the constraint "No `stub(fs, ...)`" — the rule forbids
stubbing, not IO.

`parseApi` resolves a relative path against `cwd()`, so every test must pass an **absolute** path or the result depends
on where the suite was invoked from.

- [ ] **Step 1: Write the fixture scaffolding and the first test**

Create `packages/core/src/parse/parser.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { OpenApiParser } from './parser.ts';

describe('OpenApiParser', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir({ prefix: 'goast-parser-' });
  });

  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  /** Writes `content` to `name` under the temp dir and returns its absolute path. */
  async function write(name: string, content: string): Promise<string> {
    const file = join(dir, name);
    await Deno.writeTextFile(file, content);
    return file;
  }

  it('parses a minimal document and records its source file', async () => {
    const file = await write(
      'api.yml',
      `openapi: 3.0.0
info:
  title: Test
  version: '1.0'
paths: {}
`,
    );

    const doc = await new OpenApiParser().parseApi(file);

    expect(doc.info.title).toBe('Test');
    expect(doc.$src.file).toBe(file);
  });
});
```

- [ ] **Step 2: Run it**

Run: `deno test -A packages/core/src/parse/parser.test.ts`
Expected: PASS, 1 step. If it fails on `$src.file`, note whether the parser normalizes the path — on Windows
`path.resolve` produces backslashes and the assertion must match what the parser actually stores.

- [ ] **Step 3: Add the error-path tests**

`loadDocument` throws `Unable to parse ${fileOrUrl}` when `tryParseYamlOrJson` returns `undefined`, and
`getDocumentContent` throws `Unable to download ${fileOrUrl}: ${res.statusText}` for a non-ok HTTP response. Neither is
covered.

```ts
it('throws naming the file when the content is not YAML or JSON', async () => {
  const file = await write('broken.yml', '{ this is: [not valid');
  await expect(new OpenApiParser().parseApi(file)).rejects.toThrow(`Unable to parse ${file}`);
});

it('propagates a read failure for a file that does not exist', async () => {
  await expect(new OpenApiParser().parseApi(join(dir, 'missing.yml'))).rejects.toThrow();
});
```

Confirm `'{ this is: [not valid'` really does make `parseYamlWithInfo` throw. If the YAML parser accepts it, pick input
that does fail and use that instead — the assertion must exercise the `catch` in `tryParseYamlOrJson`, and a test that
passes for the wrong reason is worse than none. Report which input you used.

Do **not** write a test that hits the network. The URL branch is reachable only through `fetch`, and a unit test that
depends on an external host violates "Deno and Docker are the only prerequisites". Instead cover the pure predicate
that guards it, which is the part with the logic:

```ts
it('treats http and https as URLs and everything else as a path', async () => {
  // `isUrl` is private; exercise it through the observable branch. A URL-looking name is not resolved
  // against cwd, so the failure names the URL verbatim rather than an absolute local path.
  await expect(new OpenApiParser().parseApi('http://127.0.0.1:1/nope.yml')).rejects.toThrow();
});
```

If that test is slow or flaky because of DNS or connection timeouts, delete it and say so in your report rather than
leaving a slow test in tier 1. Port 1 on loopback should refuse immediately, but verify.

- [ ] **Step 4: Add the `$ref` resolution tests**

`resolveReference` splits `$ref` on `#`; an empty file part means the same file, a relative part resolves against
`path.dirname(file)`. `getDeepProperty` then walks the fragment with `/` replaced by `.`.

```ts
it('resolves a local $ref and exposes the target through $ref', async () => {
  const file = await write(
    'api.yml',
    `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Target:
      type: string
      description: the target
    Source:
      $ref: '#/components/schemas/Target'
`,
  );

  const doc = await new OpenApiParser().parseApi(file);
  const source = doc.components!.schemas!.Source;

  expect(source.$ref!.type).toBe('string');
  expect(source.description).toBe('the target');
});

it('resolves a $ref into another file relative to the referring file', async () => {
  await write(
    'other.yml',
    `Target:
  type: integer
`,
  );
  const file = await write(
    'api.yml',
    `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Source:
      $ref: 'other.yml#/Target'
`,
  );

  const doc = await new OpenApiParser().parseApi(file);
  expect(doc.components!.schemas!.Source.$ref!.type).toBe('integer');
});

it('returns the same proxy instance for a component dereferenced twice', async () => {
  const file = await write(
    'api.yml',
    `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
components:
  schemas:
    Target: { type: string }
    A: { $ref: '#/components/schemas/Target' }
    B: { $ref: '#/components/schemas/Target' }
`,
  );

  const doc = await new OpenApiParser().parseApi(file);
  expect(doc.components!.schemas!.A.$ref).toBe(doc.components!.schemas!.B.$ref);
});
```

The identity assertion is the one that matters most: `dereference` caches by `openApiPath` in
`dereferencedComponents`, and the transformer's `$src.path`-keyed dedup relies on two references to one component being
the *same object*. Nothing else in the repo asserts that.

- [ ] **Step 5: Add a document-cache test**

`loadDocument` caches by file name, so parsing the same file twice through one parser must not re-read it, and two
`parseApi` calls must return the identical document proxy.

```ts
it('reuses a loaded document across parseApi calls on the same parser', async () => {
  const file = await write(
    'api.yml',
    `openapi: 3.0.0
info: { title: T, version: '1' }
paths: {}
`,
  );

  const parser = new OpenApiParser();
  const first = await parser.parseApi(file);
  const second = await parser.parseApi(file);

  expect(second).toBe(first);
});
```

Confirm this holds: `parseApi` calls `dereference(absoluteFilePath, [], doc.document)` with an empty path, so
`openApiPath` is `/` both times and the cached component is returned. If the objects differ, report the real behaviour
and what it implies for callers.

- [ ] **Step 6: Add a `parseApisAndTransform` smoke test**

This is the method `OpenApiGenerator.parseAndGenerate` calls, and it stitches parse → collect → transform.

```ts
it('parses several documents and transforms them into one ApiData', async () => {
  const a = await write(
    'a.yml',
    `openapi: 3.0.0
info: { title: A, version: '1' }
paths:
  /a:
    get:
      operationId: getA
      responses: { '200': { description: ok } }
`,
  );
  const b = await write(
    'b.yml',
    `openapi: 3.0.0
info: { title: B, version: '1' }
paths:
  /b:
    get:
      operationId: getB
      responses: { '200': { description: ok } }
`,
  );

  const data = await new OpenApiParser().parseApisAndTransform(a, b);

  expect(data.documents).toHaveLength(2);
  expect(data.endpoints.map((e) => e.name).sort()).toEqual(['getA', 'getB']);
});
```

`parseApisAndTransform` accepts `(string | string[])[]` and flattens, so also assert the array form works:

```ts
it('flattens array arguments', async () => {
  const a = await write('a.yml', `openapi: 3.0.0\ninfo: { title: A, version: '1' }\npaths: {}\n`);
  const data = await new OpenApiParser().parseApisAndTransform([a]);
  expect(data.documents).toHaveLength(1);
});
```

- [ ] **Step 7: Run and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core
git add packages/core/src/parse/parser.test.ts
git commit -m "test(core): cover OpenApiParser loading, ref resolution and caching"
```

In your report, name every expectation whose value you had to correct after running it, and say what the real value
was. Also report the suite's wall clock for this file: it does real IO and it must stay in the tens of milliseconds, not
seconds.

---

### Task 8: `collect/collector.ts`

**Files:**

- Create: `packages/core/src/collect/collector.test.ts`

**Interfaces:**

- Consumes: `derefAt` and `derefSchemaAt` from `@goast/test-harness` (Task 6).
- Produces: nothing other tasks consume.

`collectOpenApi(apis)` walks documents and returns `{ documents, schemas: Map, endpoints: Map }`. Both maps are keyed
`${$src.file}#${$src.path}` and both dedup on that key. This is where Swagger 2 and OpenAPI 3 are reconciled — and it
is done structurally, by reading both shapes unconditionally, never by inspecting a version field.

- [ ] **Step 1: Write the first test — the shape of the result**

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from '@goast/test-harness';

import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { collectOpenApi } from './collector.ts';

/** Wraps a plain document literal as the parser would, at the document root. */
// deno-lint-ignore no-explicit-any
function doc(value: Record<string, any>): Deref<OpenApiDocument> {
  return derefAt('', value) as unknown as Deref<OpenApiDocument>;
}

describe('collectOpenApi', () => {
  it('returns an empty result for no documents', () => {
    const data = collectOpenApi([]);
    expect(data.documents).toEqual([]);
    expect(data.schemas.size).toBe(0);
    expect(data.endpoints.size).toBe(0);
  });

  it('collects each document it is given', () => {
    const data = collectOpenApi([doc({ paths: {} }), doc({ paths: {} })]);
    expect(data.documents).toHaveLength(2);
  });
});
```

Run: `deno test -A packages/core/src/collect/collector.test.ts`
Expected: PASS, 2 steps.

- [ ] **Step 2: Cover OpenAPI 3 and Swagger 2 schema locations**

`collectDocument` reads `document.components?.schemas` **and** `document.definitions`, unconditionally. That is the
entire v2/v3 story for schemas.

```ts
it('collects schemas from components.schemas (OpenAPI 3)', () => {
  const data = collectOpenApi([
    doc({ components: { schemas: { Foo: derefSchemaAt('/components/schemas/Foo', { type: 'object' }) } } }),
  ]);
  expect([...data.schemas.keys()]).toEqual(['test.yml#/components/schemas/Foo']);
});

it('collects schemas from definitions (Swagger 2)', () => {
  const data = collectOpenApi([
    doc({ definitions: { Foo: derefSchemaAt('/definitions/Foo', { type: 'object' }) } }),
  ]);
  expect([...data.schemas.keys()]).toEqual(['test.yml#/definitions/Foo']);
});

it('collects both locations from one document without preferring either', () => {
  const data = collectOpenApi([
    doc({
      components: { schemas: { A: derefSchemaAt('/components/schemas/A', { type: 'object' }) } },
      definitions: { B: derefSchemaAt('/definitions/B', { type: 'object' }) },
    }),
  ]);
  expect([...data.schemas.keys()].sort()).toEqual(['test.yml#/components/schemas/A', 'test.yml#/definitions/B']);
});
```

- [ ] **Step 3: Cover schema recursion and dedup**

`collectSchema` recurses into `allOf`, `anyOf`, `oneOf`, `items`, `not`, `properties`, `patternProperties`,
`dependencies`, `definitions`, object-valued `additionalProperties` and `additionalItems`, and
`discriminator.mapping`. It returns early when the key is already present, which is what makes a recursive schema
terminate.

```ts
it('recurses into nested schemas', () => {
  const data = collectOpenApi([
    doc({
      components: {
        schemas: {
          Foo: derefSchemaAt('/components/schemas/Foo', {
            type: 'object',
            properties: { bar: { type: 'string' } },
          }),
        },
      },
    }),
  ]);
  expect([...data.schemas.keys()].sort()).toEqual([
    'test.yml#/components/schemas/Foo',
    'test.yml#/components/schemas/Foo/properties/bar',
  ]);
});

it('collects a schema once even when two places reference the same object', () => {
  const shared = derefSchemaAt('/components/schemas/Shared', { type: 'string' });
  const data = collectOpenApi([
    doc({
      components: {
        schemas: {
          Shared: shared,
          A: derefSchemaAt('/components/schemas/A', { type: 'object', properties: {} }),
        },
      },
    }),
  ]);
  // `A` and the top level both hand `Shared` to collectSchema; the key guard keeps one entry.
  collectOpenApi([doc({ components: { schemas: { Shared: shared } } })]);
  expect([...data.schemas.keys()].filter((k) => k.endsWith('/Shared'))).toHaveLength(1);
});

it('terminates on a self-referential schema', () => {
  // deno-lint-ignore no-explicit-any
  const node: any = { type: 'object', properties: {} };
  const proxied = derefSchemaAt('/components/schemas/Node', node);
  // Point the schema at itself after proxying, which is the shape a $ref cycle produces.
  (proxied.properties as Record<string, unknown>).self = proxied;

  const data = collectOpenApi([doc({ components: { schemas: { Node: proxied } } })]);
  expect(data.schemas.size).toBe(1);
});
```

The cycle test is the important one — write it, run it, and if it hangs or overflows the stack, **that is a finding**:
stop, record it for Task 12 with the exact input, and mark the test `it.skip` with a comment naming the defect rather
than leaving a hanging test in the suite. If it passes, keep it: nothing else in the repo proves termination.

- [ ] **Step 4: Cover endpoint collection and keying**

`collectPathItem` iterates the eight HTTP methods, keys each operation `${operation.$src.file}#${operation.$src.path}`,
and skips a key it already has.

```ts
it('collects one endpoint per HTTP method present on a path item', () => {
  const data = collectOpenApi([
    doc({
      paths: {
        '/a': derefAt('/paths/~1a', {
          get: derefAt('/paths/~1a/get', { responses: {} }),
          post: derefAt('/paths/~1a/post', { responses: {} }),
        }),
      },
    }),
  ]);
  expect([...data.endpoints.values()].map((e) => e.method).sort()).toEqual(['get', 'post']);
});

it('records the path and method it found an operation under', () => {
  const data = collectOpenApi([
    doc({
      paths: {
        '/a/{id}': derefAt('/paths/~1a~1{id}', { get: derefAt('/paths/~1a~1{id}/get', { responses: {} }) }),
      },
    }),
  ]);
  const endpoint = [...data.endpoints.values()][0];
  expect(endpoint.path).toBe('/a/{id}');
  expect(endpoint.method).toBe('get');
});

it('ignores a method key that is not set', () => {
  const data = collectOpenApi([
    doc({ paths: { '/a': derefAt('/paths/~1a', { get: undefined, summary: 'nothing here' }) } }),
  ]);
  expect(data.endpoints.size).toBe(0);
});
```

- [ ] **Step 5: Cover the bare-JSON-Schema document case**

`collectDocument` ends with: if the document has any of `['$id', 'allOf', 'anyOf', 'oneOf', 'enum', 'not',
'properties', 'title', 'type']` as an own key, the **document itself** is collected as a schema. That is how a plain
JSON Schema file, not an OpenAPI document, gets picked up. It is untested and non-obvious.

```ts
it('collects the document itself as a schema when it looks like a bare JSON Schema', () => {
  const data = collectOpenApi([doc({ type: 'object', properties: {} })]);
  expect([...data.schemas.keys()]).toEqual(['test.yml#/']);
});

it('does not collect an ordinary OpenAPI document as a schema', () => {
  const data = collectOpenApi([doc({ openapi: '3.0.0', paths: {} })]);
  expect(data.schemas.size).toBe(0);
});

it('treats title alone as enough to make a document a schema', () => {
  const data = collectOpenApi([doc({ title: 'Just a title' })]);
  expect(data.schemas.size).toBe(1);
});
```

The expected key in the first case depends on what `$src.path` the fixture gives the document root — `derefAt('')`
yields `''`, so the key is `test.yml#`. Run it and use the real value. The third case is worth keeping even if it looks
odd: an OpenAPI document with a top-level `title` would be collected as a schema, and if that is surprising it is a
finding for Task 12.

- [ ] **Step 6: Cover the `isSchema` branch in `collectResponse`**

`collectResponse` treats a response header as a schema when it has a `type` key, and as a header otherwise. That is a
Swagger 2 shape and the discrimination is `obj['type'] !== undefined` — so a header with `type` set is read as a
schema, and an OpenAPI 3 header (`{ schema: { type: ... } }`) is read as a header.

```ts
it('reads a Swagger 2 response header with a type as a schema', () => {
  const data = collectOpenApi([
    doc({
      paths: {
        '/a': derefAt('/paths/~1a', {
          get: derefAt('/paths/~1a/get', {
            responses: {
              '200': derefAt('/paths/~1a/get/responses/200', {
                headers: { 'X-Rate': derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate', { type: 'integer' }) },
              }),
            },
          }),
        }),
      },
    }),
  ]);
  expect([...data.schemas.keys()]).toContain('test.yml#/paths/~1a/get/responses/200/headers/X-Rate');
});
```

- [ ] **Step 7: Run and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core
git add packages/core/src/collect/collector.test.ts
git commit -m "test(core): cover collectOpenApi keying, recursion and v2/v3 shapes"
```

Report every expectation whose value you corrected after running, and everything you found that belongs in Task 12.

---

### Task 9: `transform/transform-document.ts` and `transform/transformer.ts`

**Files:**

- Create: `packages/core/src/transform/transform-document.test.ts`
- Create: `packages/core/src/transform/transformer.test.ts`
- Modify: `packages/core/src/transform/transform-schema.test.ts`
- Create: `test/harness/transform-context.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: `derefAt` from `@goast/test-harness` (Task 6).
- Produces, exported from `@goast/test-harness`:
  `createTransformerContext(options?: Partial<OpenApiTransformerOptions>): OpenApiTransformerContext` — a fully
  populated context with a fresh `IdGenerator` and every `Map` initialized, matching what `transformOpenApi` builds.
- Consumed by Tasks 9, 10 and 11.

`transform-schema.test.ts` has a private `createContext()` that casts through `unknown` because it only fills the
fields `transformSchema` touches. `transformDocument` and `transformEndpoint` touch more. Build one honest factory.

- [ ] **Step 1: Write the shared context factory**

Create `test/harness/transform-context.ts`. Mirror `transformOpenApi`'s own context literal
(`packages/core/src/transform/transformer.ts:16-35`) exactly, so a test context and a production context cannot drift:

```ts
import { IdGenerator } from '@goast/core';
import type { OpenApiCollectorData, OpenApiTransformerContext, OpenApiTransformerOptions } from '@goast/core';
import { defaultOpenApiTransformerOptions } from '@goast/core';

/**
 * Builds the same context `transformOpenApi` builds, so a unit test of one transform step sees the
 * state the whole pipeline would have given it.
 *
 * Kept in lockstep with the literal in `transformer.ts` deliberately: a test-only context that fills
 * just the fields one function happens to read passes even when the function starts reading another,
 * which is how a partial fixture turns a real regression into a green suite.
 */
export function createTransformerContext(
  options?: Partial<OpenApiTransformerOptions>,
  input?: OpenApiCollectorData,
): OpenApiTransformerContext {
  return {
    config: { ...defaultOpenApiTransformerOptions, ...options },

    idGenerator: new IdGenerator(),
    input: input ?? { documents: [], schemas: new Map(), endpoints: new Map() },
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),

    transformed: {
      services: new Map(),
      paths: new Map(),
      parameters: new Map(),
      requestBodies: new Map(),
      responses: new Map(),
      content: new Map(),
      headers: new Map(),
      schemas: new Map(),
    },
  };
}
```

Verify `IdGenerator`, `OpenApiTransformerContext`, `OpenApiTransformerOptions`, `OpenApiCollectorData` and
`defaultOpenApiTransformerOptions` are all exported from `@goast/core`'s barrel:

```bash
deno eval "import { IdGenerator, defaultOpenApiTransformerOptions } from '@goast/core'; console.log(typeof IdGenerator, typeof defaultOpenApiTransformerOptions)"
```

Expected: `function object`. If either is missing, import by relative path and report it; do not widen core's public
API for a test.

Add `export * from './transform-context.ts';` to `test/harness/mod.ts`.

- [ ] **Step 2: Switch `transform-schema.test.ts` to the shared factory**

Delete its private `createContext` and use `createTransformerContext()`. Run
`deno test -A packages/core/src/transform/transform-schema.test.ts` and expect the **same** test count and all passing.
If a test now fails, the shared factory is more complete than the private one and it has surfaced a real dependency —
report which test and why before changing anything.

- [ ] **Step 3: Write `transform-document.test.ts`**

`transformDocument` only walks `document.tags` and turns each into an `ApiService`. `transformTag` dedups on
`getOpenApiObjectIdentifier(tag)`, falls back to the generated id when `tag.name` is absent, recurses through `$ref`,
and registers a `$ref`-reached tag in `transformed.services` but **not** in `services`.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { createTransformerContext, derefAt } from '@goast/test-harness';

import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { transformDocument } from './transform-document.ts';

// deno-lint-ignore no-explicit-any
const doc = (value: Record<string, any>) => derefAt('', value) as unknown as Deref<OpenApiDocument>;

describe('transformDocument', () => {
  it('does nothing for a document with no tags', () => {
    const context = createTransformerContext();
    transformDocument(context, doc({}));
    expect(context.services.size).toBe(0);
  });

  it('creates one service per tag, keyed by name', () => {
    const context = createTransformerContext();
    transformDocument(
      context,
      doc({
        tags: [
          derefAt('/tags/0', { name: 'pets', description: 'Pet things' }),
          derefAt('/tags/1', { name: 'store' }),
        ],
      }),
    );

    expect([...context.services.keys()].sort()).toEqual(['pets', 'store']);
    expect(context.services.get('pets')!.description).toBe('Pet things');
  });

  it('falls back to the generated id when a tag has no name', () => {
    const context = createTransformerContext();
    transformDocument(context, doc({ tags: [derefAt('/tags/0', {})] }));

    const service = [...context.services.values()][0];
    expect(service.name).toBe(service.id);
  });

  it('returns the existing service for a tag it has already transformed', () => {
    const context = createTransformerContext();
    const tag = derefAt('/tags/0', { name: 'pets' });

    transformDocument(context, doc({ tags: [tag] }));
    transformDocument(context, doc({ tags: [tag] }));

    expect(context.services.size).toBe(1);
    expect(context.transformed.services.size).toBe(1);
  });

  it('records a $ref-reached tag as transformed without registering it as a service', () => {
    const context = createTransformerContext();
    const target = derefAt('/components/tags/0', { name: 'target' });
    transformDocument(context, doc({ tags: [derefAt('/tags/0', { name: 'source' }, target)] }));

    expect([...context.services.keys()]).toEqual(['source']);
    expect(context.transformed.services.size).toBe(2);
    expect(context.services.get('source')!.$ref!.name).toBe('target');
  });
});
```

The last test is the subtle one: `transformTag(context, tag.$ref, true)` passes `isReference = true`, so the target
lands in `transformed.services` but never in `services`. Nothing else asserts that, and getting it backwards would
silently duplicate services in generated output.

- [ ] **Step 4: Write `transformer.test.ts`**

`transformOpenApi` is the wiring: build a context, `transformDocument` every document, `transformSchema` every collected
schema, `transformEndpoint` every collected endpoint, then flatten the maps into `ApiData`. Test the wiring and the
option merge, not the individual steps — those have their own files.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from '@goast/test-harness';

import type { OpenApiCollectorData } from '../collect/types.ts';
import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { transformOpenApi } from './transformer.ts';

// deno-lint-ignore no-explicit-any
const doc = (value: Record<string, any>) => derefAt('', value) as unknown as Deref<OpenApiDocument>;

const empty = (): OpenApiCollectorData => ({ documents: [], schemas: new Map(), endpoints: new Map() });

describe('transformOpenApi', () => {
  it('returns empty collections for empty input', () => {
    const data = transformOpenApi(empty());
    expect(data.documents).toEqual([]);
    expect(data.services).toEqual([]);
    expect(data.endpoints).toEqual([]);
    expect(data.schemas).toEqual([]);
  });

  it('passes the documents through unchanged', () => {
    const input = empty();
    const d = doc({ paths: {} });
    input.documents.push(d);

    expect(transformOpenApi(input).documents).toEqual([d]);
  });

  it('transforms tags into services', () => {
    const input = empty();
    input.documents.push(doc({ tags: [derefAt('/tags/0', { name: 'pets' })] }));

    expect(transformOpenApi(input).services.map((s) => s.name)).toEqual(['pets']);
  });

  it('transforms collected schemas', () => {
    const input = empty();
    input.schemas.set(
      'test.yml#/components/schemas/Foo',
      derefSchemaAt('/components/schemas/Foo', { type: 'object' }),
    );

    expect(transformOpenApi(input).schemas).toHaveLength(1);
  });

  it('merges the given options over the defaults', () => {
    // `transformOpenApi` spreads `defaultOpenApiTransformerOptions` then the argument. Pick an option
    // whose effect is observable in the result rather than asserting on the context, which is private.
    const input = empty();
    input.schemas.set(
      'test.yml#/components/schemas/Foo',
      derefSchemaAt('/components/schemas/Foo', { type: 'object' }),
    );

    expect(() => transformOpenApi(input, {})).not.toThrow();
  });
});
```

The last test as written asserts almost nothing. Replace it with a real assertion: read
`defaultOpenApiTransformerOptions` in `packages/core/src/transform/types.ts`, pick one option with an observable effect
on transformed output, and assert the default and the override produce different results. If no option has an
observable effect at this level, **delete the test** and say so in your report — a test that only checks
`not.toThrow()` is worse than no test, because it looks like coverage.

- [ ] **Step 5: Run and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core test/harness
git add packages/core/src/transform test/harness/transform-context.ts test/harness/mod.ts
git commit -m "test(core): cover transformDocument and the transformOpenApi wiring"
```

---

### Task 10: `transform/transform-endpoint.ts`

**Files:**

- Create: `packages/core/src/transform/transform-endpoint.test.ts`

**Interfaces:**

- Consumes: `createTransformerContext` (Task 9), `derefAt` and `derefSchemaAt` (Task 6).
- Produces: nothing other tasks consume.

At 331 lines this is the largest untested file in `transform/`, and it owns eight nested transforms: paths, parameters,
request bodies, responses, content, media types, headers, and the service attachment. Every one of them dedups through
a `transformed.*` map keyed by `getOpenApiObjectIdentifier`.

`transformEndpoint` takes an `OpenApiCollectorEndpointInfo`, which is `{ path, method, pathItem, operation }`.

- [ ] **Step 1: Write the scaffolding and the first test**

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { createTransformerContext, derefAt, derefSchemaAt } from '@goast/test-harness';

import type { OpenApiCollectorEndpointInfo } from '../collect/types.ts';
import { transformEndpoint } from './transform-endpoint.ts';

/** Builds the collector's endpoint info for one operation on one path. */
function endpointInfo(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete',
  // deno-lint-ignore no-explicit-any
  operation: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  pathItem: Record<string, any> = {},
): OpenApiCollectorEndpointInfo {
  const escaped = path.replace(/\//g, '~1');
  return {
    path,
    method,
    pathItem: derefAt(`/paths/${escaped}`, pathItem),
    operation: derefAt(`/paths/${escaped}/${method}`, operation),
    // deno-lint-ignore no-explicit-any
  } as any;
}

describe('transformEndpoint', () => {
  it('transforms a minimal operation', () => {
    const context = createTransformerContext();
    const endpoint = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'listPets' }));

    expect(endpoint.name).toBe('listPets');
    expect(endpoint.path).toBe('/pets');
    expect(endpoint.method).toBe('get');
    expect(endpoint.deprecated).toBe(false);
    expect(endpoint.tags).toEqual([]);
    expect(endpoint.parameters).toEqual([]);
    expect(endpoint.requestBody).toBeUndefined();
    expect(endpoint.responses).toEqual([]);
  });
});
```

Run: `deno test -A packages/core/src/transform/transform-endpoint.test.ts`
Expected: PASS, 1 step. `determineEndpointName` decides `name`; if `listPets` is not what it produces, read
`packages/core/src/transform/helpers.ts` and use the real value.

- [ ] **Step 2: Cover the service attachment, including the empty-tag fallback**

`transformEndpoint` attaches the endpoint to one service per tag, and when there are no tags it uses the single tag
`''` — creating a service whose `name` is its generated id, since `tag || id` falls back on the empty string.

```ts
it('attaches the endpoint to one service per tag', () => {
  const context = createTransformerContext();
  transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a', tags: ['pets', 'store'] }));

  expect([...context.services.keys()].sort()).toEqual(['pets', 'store']);
  expect(context.services.get('pets')!.endpoints).toHaveLength(1);
  expect(context.services.get('store')!.endpoints).toHaveLength(1);
});

it('creates a service under the empty tag for an untagged operation, named after its id', () => {
  const context = createTransformerContext();
  transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));

  expect([...context.services.keys()]).toEqual(['']);
  const service = context.services.get('')!;
  expect(service.name).toBe(service.id);
});

it('reuses a service created by an earlier endpoint', () => {
  const context = createTransformerContext();
  transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', tags: ['pets'] }));
  transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', tags: ['pets'] }));

  expect(context.services.size).toBe(1);
  expect(context.services.get('pets')!.endpoints).toHaveLength(2);
});
```

Note that the service created here has **no `$src`** — the object literal at
`packages/core/src/transform/transform-endpoint.ts:60` omits it, while `transformTag` in `transform-document.ts` sets
it. Assert the actual behaviour:

```ts
it('creates the implicit service without a $src, unlike a tag-derived service', () => {
  const context = createTransformerContext();
  transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
  expect(context.services.get('')!.$src).toBeUndefined();
});
```

If this passes, it is a real inconsistency: a consumer reading `service.$src.file` crashes for implicit services.
Record it for Task 12.

- [ ] **Step 3: Cover path transformation and its cache**

`transformApiPath` caches by `path` string in `context.paths` and by object identity in `context.transformed.paths`,
and attaches the endpoint to the path under its method key.

```ts
it('records the endpoint on its path under the method key', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));

  expect(context.paths.get('/pets')!.get).toBe(endpoint);
  expect(endpoint.pathInfo.path).toBe('/pets');
});

it('reuses one ApiPath for two methods on the same path', () => {
  const context = createTransformerContext();
  const get = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
  const post = transformEndpoint(context, endpointInfo('/pets', 'post', { operationId: 'b' }));

  expect(post.pathInfo).toBe(get.pathInfo);
  expect(context.paths.size).toBe(1);
  expect(context.paths.get('/pets')!.get).toBe(get);
  expect(context.paths.get('/pets')!.post).toBe(post);
});

it('keys endpoints by method and path', () => {
  const context = createTransformerContext();
  transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
  transformEndpoint(context, endpointInfo('/pets', 'post', { operationId: 'b' }));

  expect([...context.endpoints.keys()].sort()).toEqual(['get:/pets', 'post:/pets']);
});
```

- [ ] **Step 4: Cover parameter combination — including the name-only collision**

`combineParameters` starts from the path-level parameters and replaces any whose `name` matches an operation-level
parameter. It compares **`name` only**, ignoring `target` (the `in` value).

```ts
it('inherits path-level parameters', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/pets/{id}', 'get', { operationId: 'a' }, {
      parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path', required: true })],
    }),
  );

  expect(endpoint.parameters.map((p) => p.name)).toEqual(['id']);
  expect(endpoint.parameters[0].target).toBe('path');
  expect(endpoint.parameters[0].required).toBe(true);
});

it('appends an operation parameter that does not shadow a path parameter', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/pets/{id}', 'get', {
      operationId: 'a',
      parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'limit', in: 'query' })],
    }, {
      parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path' })],
    }),
  );

  expect(endpoint.parameters.map((p) => p.name)).toEqual(['id', 'limit']);
});

it('lets an operation parameter replace a path parameter with the same name in the same position', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/pets/{id}', 'get', {
      operationId: 'a',
      parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'id', in: 'path', description: 'op' })],
    }, {
      parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path', description: 'path' })],
    }),
  );

  expect(endpoint.parameters).toHaveLength(1);
  expect(endpoint.parameters[0].description).toBe('op');
});

it('replaces a path parameter with a same-named operation parameter in a DIFFERENT position', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/pets/{id}', 'get', {
      operationId: 'a',
      parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'id', in: 'query' })],
    }, {
      parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path' })],
    }),
  );

  // combineParameters matches on `name` alone, so the query parameter displaces the path parameter and
  // the path parameter is lost — for `/pets/{id}` that means the generated signature has no `id` path
  // argument at all. OpenAPI identifies a parameter by (name, in), not by name.
  expect(endpoint.parameters).toHaveLength(1);
  expect(endpoint.parameters[0].target).toBe('query');
});
```

That last test pins a defect. Confirm the behaviour by running it, keep the comment, and record it for Task 12. Do not
fix `combineParameters` here — it would change generated output, which this phase is not allowed to do.

- [ ] **Step 5: Cover responses, including the status-code coercion**

`transformResponse` sets `statusCode: Number(status) || undefined`. So `'default'` becomes `undefined` — and so does
`'0'`, because `Number('0')` is `0` and `0 || undefined` is `undefined`.

```ts
it('parses a numeric status code', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: { '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok' }) },
    }),
  );

  expect(endpoint.responses).toHaveLength(1);
  expect(endpoint.responses[0].statusCode).toBe(200);
  expect(endpoint.responses[0].description).toBe('ok');
});

it('leaves statusCode undefined for the default response', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: { default: derefAt('/paths/~1a/get/responses/default', { description: 'fallback' }) },
    }),
  );

  expect(endpoint.responses[0].statusCode).toBeUndefined();
});

it('leaves statusCode undefined for a range code such as 2XX', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: { '2XX': derefAt('/paths/~1a/get/responses/2XX', { description: 'any success' }) },
    }),
  );

  expect(endpoint.responses[0].statusCode).toBeUndefined();
});
```

`transformResponses` skips keys for which `isOpenApiObjectProperty(status)` is false — read
`packages/core/src/internal-utils.ts` to see what that excludes (it filters the `$`-prefixed keys the deref proxy adds)
and add one test proving `$src` and `$ref` are not treated as status codes:

```ts
it('does not treat the proxy $src and $ref keys as status codes', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: derefAt('/paths/~1a/get/responses', {
        '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok' }),
      }),
    }),
  );

  expect(endpoint.responses).toHaveLength(1);
});
```

- [ ] **Step 6: Cover content, request bodies and headers**

```ts
it('transforms request body content by media type', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'post', {
      operationId: 'a',
      requestBody: derefAt('/paths/~1a/post/requestBody', {
        required: true,
        content: {
          'application/json': derefAt('/paths/~1a/post/requestBody/content/application~1json', {
            schema: derefSchemaAt('/paths/~1a/post/requestBody/content/application~1json/schema', { type: 'object' }),
          }),
        },
      }),
    }),
  );

  expect(endpoint.requestBody!.required).toBe(true);
  expect(endpoint.requestBody!.content).toHaveLength(1);
  expect(endpoint.requestBody!.content[0].type).toBe('application/json');
  expect(endpoint.requestBody!.content[0].schema).toBeDefined();
});

it('defaults requestBody.required to false', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'post', {
      operationId: 'a',
      requestBody: derefAt('/paths/~1a/post/requestBody', { content: {} }),
    }),
  );

  expect(endpoint.requestBody!.required).toBe(false);
});

it('transforms an OpenAPI 3 response header', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: {
        '200': derefAt('/paths/~1a/get/responses/200', {
          description: 'ok',
          headers: {
            'X-Rate': derefAt('/paths/~1a/get/responses/200/headers/X-Rate', {
              required: true,
              schema: derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate/schema', { type: 'integer' }),
            }),
          },
        }),
      },
    }),
  );

  const header = endpoint.responses[0].headers[0];
  expect(header.name).toBe('X-Rate');
  expect(header.required).toBe(true);
  expect(header.schema).toBeDefined();
});

it('transforms a Swagger 2 response header, which is a bare schema, as not required', () => {
  const context = createTransformerContext();
  const endpoint = transformEndpoint(
    context,
    endpointInfo('/a', 'get', {
      operationId: 'a',
      responses: {
        '200': derefAt('/paths/~1a/get/responses/200', {
          description: 'ok',
          headers: {
            'X-Rate': derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate', { type: 'integer' }),
          },
        }),
      },
    }),
  );

  const header = endpoint.responses[0].headers[0];
  expect(header.name).toBe('X-Rate');
  expect(header.required).toBe(false);
  expect(header.schema).toBeDefined();
});
```

The last two together are the `isSchema` branch in `transformHeader` — the same `obj['type'] !== undefined`
discrimination the collector uses. Both shapes are in the corpus and neither is unit-tested.

- [ ] **Step 7: Cover the dedup maps**

Every nested transform returns the cached object when handed the same source object twice. Prove it for at least
parameters and content, which are the two most likely to be shared across operations:

```ts
it('returns the same ApiParameter for one source parameter used by two operations', () => {
  const context = createTransformerContext();
  const shared = derefAt('/components/parameters/Limit', { name: 'limit', in: 'query' });

  const a = transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', parameters: [shared] }));
  const b = transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', parameters: [shared] }));

  expect(b.parameters[0]).toBe(a.parameters[0]);
  expect(context.transformed.parameters.size).toBe(1);
});
```

- [ ] **Step 8: Run and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core
git add packages/core/src/transform/transform-endpoint.test.ts
git commit -m "test(core): cover transformEndpoint paths, parameters, responses and headers"
```

Report every expectation you corrected after running, and every finding for Task 12 with its exact reproducing input.

---

### Task 11: `codegen/`

**Files:**

- Create: `packages/core/src/codegen/internal-utils.test.ts`
- Create: `packages/core/src/codegen/config.test.ts`
- Create: `packages/core/src/codegen/generator.test.ts`

**Interfaces:**

- Consumes: nothing from the harness fixtures. `generate()` does real IO, so this task uses a temp directory.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Cover `addSourceIfTest`**

`packages/core/src/codegen/internal-utils.ts` is six lines and is the mechanism the whole tier-2 `__source__`
provenance depends on. It has three branches.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { addSourceIfTest } from './internal-utils.ts';

describe('addSourceIfTest', () => {
  it('adds __source__ when __test__ is set', () => {
    const result: Record<string, unknown> = {};
    addSourceIfTest({ __test__: true }, result, () => 'the source');
    expect(result.__source__).toBe('the source');
  });

  it('does nothing when __test__ is not set', () => {
    const result: Record<string, unknown> = {};
    addSourceIfTest({}, result, () => 'the source');
    expect('__source__' in result).toBe(false);
  });

  it('does not overwrite an existing __source__', () => {
    const result: Record<string, unknown> = { __source__: 'first' };
    addSourceIfTest({ __test__: true }, result, () => 'second');
    expect(result.__source__).toBe('first');
  });

  it('does not call the source function when it would not use the result', () => {
    let called = false;
    addSourceIfTest({}, {}, () => {
      called = true;
      return 'x';
    });
    expect(called).toBe(false);
  });
});
```

The last test matters because `sourceFn` is a closure that generators build eagerly-looking but pass lazily; if it were
always invoked, `__test__: false` runs would pay for provenance they discard.

- [ ] **Step 2: Cover the default config**

`defaultOpenApiGeneratorConfig` is what every generator inherits, and its documented defaults are load-bearing —
`existingFileBehavior: 'error'` in particular, since `'count'` and `'override'` both mask collisions.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { defaultOpenApiGeneratorConfig } from './config.ts';

describe('defaultOpenApiGeneratorConfig', () => {
  it('defaults outputDir to generated', () => {
    expect(defaultOpenApiGeneratorConfig.outputDir).toBe('generated');
  });

  it('clears the output directory by default', () => {
    expect(defaultOpenApiGeneratorConfig.clearOutputDir).toBe(true);
  });

  it('errors on an existing file by default, rather than overwriting or counting', () => {
    expect(defaultOpenApiGeneratorConfig.existingFileBehavior).toBe('error');
  });
});
```

- [ ] **Step 3: Cover the `OpenApiGenerator` provider chain**

`use`, `useType`, `useFn` and `useValue` all funnel into `use`, which pushes onto `this._providers` and then returns a
**new** `_OpenApiGenerator` holding a copy. Because the push happens before the copy, the receiver's own list grows
too.

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import type { ApiData } from '../transform/api-types.ts';
import { OpenApiGenerator } from './generator.ts';

const emptyData = (): ApiData => ({ documents: [], services: [], endpoints: [], schemas: [] });

describe('OpenApiGenerator', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir({ prefix: 'goast-generator-' });
  });

  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('runs a registered function provider and returns its output', async () => {
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({ a: 1 }));

    expect(await generator.generate(emptyData())).toEqual({ a: 1 });
  });

  it('runs providers in registration order and merges their outputs', async () => {
    const order: string[] = [];
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => {
        order.push('first');
        return { a: 1 };
      })
      .useFn(() => {
        order.push('second');
        return { b: 2 };
      });

    expect(await generator.generate(emptyData())).toEqual({ a: 1, b: 2 });
    expect(order).toEqual(['first', 'second']);
  });

  it('passes each provider the accumulated output of the previous ones', async () => {
    let seen: unknown;
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({ a: 1 }))
      .useFn((context) => {
        seen = context.input;
        return {};
      });

    await generator.generate(emptyData());
    expect(seen).toEqual({ a: 1 });
  });

  it('passes the provider config through', async () => {
    let seen: unknown;
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn((_context, config) => {
        seen = config;
        return {};
      }, { custom: 'value' } as never);

    await generator.generate(emptyData());
    expect(seen).toEqual({ custom: 'value' });
  });

  it('creates the output directory', async () => {
    const out = join(dir, 'out');
    await new OpenApiGenerator({ outputDir: out }).useFn(() => ({})).generate(emptyData());
    expect((await Deno.stat(out)).isDirectory).toBe(true);
  });

  it('empties an existing output directory when clearOutputDir is true', async () => {
    const out = join(dir, 'out');
    await Deno.mkdir(out);
    await Deno.writeTextFile(join(out, 'stale.txt'), 'old');

    await new OpenApiGenerator({ outputDir: out, clearOutputDir: true }).useFn(() => ({})).generate(emptyData());

    await expect(Deno.stat(join(out, 'stale.txt'))).rejects.toThrow();
  });

  it('keeps existing files when clearOutputDir is false', async () => {
    const out = join(dir, 'out');
    await Deno.mkdir(out);
    await Deno.writeTextFile(join(out, 'stale.txt'), 'old');

    await new OpenApiGenerator({ outputDir: out, clearOutputDir: false }).useFn(() => ({})).generate(emptyData());

    expect(await Deno.readTextFile(join(out, 'stale.txt'))).toBe('old');
  });
});
```

`outputDir` is passed through `resolve()`, so an absolute temp path is required — a relative one would write into the
repository. Every test here must use `join(dir, ...)`.

- [ ] **Step 4: Pin the provider-list aliasing**

```ts
it('accumulates providers on the receiver as well as the returned generator', async () => {
  const base = new OpenApiGenerator({ outputDir: join(dir, 'out') });
  base.useFn(() => ({ a: 1 }));
  const second = base.useFn(() => ({ b: 2 }));

  // `use` pushes onto the receiver's own array before copying it, so `base` is not an independent
  // starting point: branching twice off one generator gives the second branch the first branch's
  // providers too.
  expect(await second.generate(emptyData())).toEqual({ a: 1, b: 2 });
});
```

Run this and record what actually happens. If both providers run, the fluent API is not immutable and branching off a
shared base is unsafe — a finding for Task 12. If only the second runs, delete the test and say the aliasing concern
was unfounded. **Do not change `generator.ts`.**

- [ ] **Step 5: Pin `mergeDeep`'s array handling**

`mergeDeep` (`packages/core/src/codegen/generator.ts:134`) checks `value && typeof value === 'object'` before
`Array.isArray(value)`. Arrays are objects, so the first branch always wins and the `Array.isArray` branch — the one
that concatenates — is unreachable.

```ts
it('merges arrays from two providers element-wise rather than concatenating them', async () => {
  const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
    .useFn(() => ({ items: ['a', 'b'] }))
    .useFn(() => ({ items: ['c'] }));

  const result = await generator.generate(emptyData()) as { items: string[] };

  // mergeDeep tests `typeof value === 'object'` before `Array.isArray`, and an array satisfies the
  // first, so the concatenating branch below it is dead code. Two providers contributing to the same
  // array key overwrite by index instead of appending.
  expect(result.items).toEqual(['c', 'b']);
});
```

Run it. `['c', 'b']` is the prediction from reading the code; use whatever it really produces and keep the comment
accurate. Either way this is a finding for Task 12 — the `Array.isArray` branch exists, so concatenation was intended.

- [ ] **Step 6: Cover the three generator base classes**

`endpoints-generator.ts`, `schemas-generator.ts` and `services-generator.ts` are abstract bases that iterate
`data.endpoints`, `data.schemas` and `data.services` respectively. Read all three, then write one test file per class
asserting: it visits every item, it returns the shape its `onGenerate` builds, and it does nothing for empty input.
Create them as `packages/core/src/codegen/{endpoints,schemas,services}-generator.test.ts`.

If a class turns out to have no behaviour of its own beyond delegating to an abstract method — i.e. a test could only
assert that a stub subclass's method was called — **write that one test and no more**, and say so. A file of tests that
each assert "the abstract method I supplied was invoked" is padding, not coverage.

- [ ] **Step 7: Run and commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core
git add packages/core/src/codegen
git commit -m "test(core): cover the generator chain, output-dir handling and config defaults"
```

Report the real value of every expectation you corrected, the wall clock for the IO-touching tests, and every finding
for Task 12.

---

### Task 12: Register the findings, and document tier 1

**Files:**

- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`
- Modify: `test/README.md`
- Modify: `docs/superpowers/specs/2026-07-25-testing-strategy-design.md`

**Interfaces:**

- Consumes: the findings reported by Tasks 5 through 11.

Tasks 5-11 pin behaviour that looks wrong. A pinned defect nobody records reads as accepted behaviour, and the next
person to "fix" it breaks a passing test with no explanation of why the test wanted the broken value.

- [ ] **Step 1: Collect every finding**

Read the reports from Tasks 5 through 11 and list every finding. The ones this plan already predicts, each of which
must be **verified against the committed test and the source before you write it up** — a prediction is not evidence:

1. **`mergeDeep`'s `Array.isArray` branch is unreachable** (`packages/core/src/codegen/generator.ts:134-152`). Arrays
   satisfy `typeof value === 'object'`, so the concatenating branch below never runs and two providers contributing to
   one array key merge by index. Cite the Task 11 Step 5 test.
2. **`combineParameters` matches on `name` alone** (`packages/core/src/transform/transform-endpoint.ts:253-264`),
   ignoring `target`. OpenAPI identifies a parameter by `(name, in)`. A query parameter named `id` displaces a path
   parameter named `id`, so `/pets/{id}` can lose its path argument. Cite the Task 10 Step 4 test.
3. **The implicit service has no `$src`** (`packages/core/src/transform/transform-endpoint.ts:60-67`) while a
   tag-derived service does (`transform-document.ts:22-31`). A consumer reading `service.$src.file` crashes for
   untagged operations. Cite the Task 10 Step 2 test.
4. **`statusCode: Number(status) || undefined`** (`transform-endpoint.ts:205`) maps `'0'` to `undefined` as well as
   `'default'`, because `0` is falsy. Cross-reference **defect 19**, which is the `responseCode = null` consequence in
   the Kotlin controller generator.
5. **`createTypeof` is exported** from `packages/typescript/src/ast/nodes/typeof.ts` where every sibling node keeps its
   factory private. Public API surface; note whether anything imports it.

Add whatever Tasks 5-11 found beyond these. If a predicted finding turned out not to hold, say so explicitly rather
than registering it — this plan's predictions are not evidence.

- [ ] **Step 2: Write the register entries**

Continue the numbering from the register's highest existing entry. Match the format of the entries immediately above
`### Also registered, not scheduled`: the generator or module, the symptom, the root cause with a `path:line`, what
pins it, and a closing "Not fixed here" note. Add a named element citing the tier-1 test that pins each one, the way
tier 3's entries carry a `**Compile gate:**` element — use a consistent label such as `**Tier 1:**` and the same
wording every time.

Findings with no behavioural consequence (the `createTypeof` export) belong as bullets under
`### Also registered, not scheduled`, not as numbered defects. Findings that make generated output wrong get numbers.

- [ ] **Step 3: Document tier 1 in `test/README.md`**

The file's `## Tiers` table already lists tier 1 as active with command `deno task test`. There is no prose section for
it. Add `## Tier 1: unit tests` before `## Snapshot modes`, covering:

- What tier 1 answers and what it does not: it tests functions directly, and never asserts on generated file content —
  that is tier 2's job.
- The convention, as the six rules: `it` not `test`, `@std/expect` not `@std/expect/expect`, literal `\n` not `EOL`,
  one top-level `describe` per exported symbol in a colocated `<symbol-file>.test.ts`, no `stub(fs, ...)`, and real IO
  against a temp directory when IO is unavoidable.
- The `EOL` carve-out from Global Constraints, and why it exists: `SourceBuilder`/`StringBuilder` default `newLine` to
  `os.EOL`, so the one test asserting that default must import `EOL` independently or it degenerates into comparing the
  implementation to itself. Say that every other expectation pins `newLine: '\n'`, and that tier 2's output test does the
  same at `test/output-tests/output.test.ts:22` — a reader needs to know the generated line ending is a *setting*, not a
  constant, and that the committed snapshots depend on it being pinned.
- `dedent(n)` from `@goast/test-harness`: what it does, that it deliberately does not touch line endings, and that its
  predecessor `normalizeEOL` was retired because host-dependent expectations made a passing suite meaningless.
- `derefAt` / `derefSchemaAt` / `createTransformerContext` from `@goast/test-harness`: what each builds and why core
  transform tests must go through the real `createDerefProxy` rather than a plain object with a `$src` field.
- That `test/compile/` and `test/output/` are off limits to tier 1, and that a tier-1 test which needs generated output
  to exist is in the wrong tier.
- A pointer to the defect register for the behaviours tier 1 deliberately pins as-is.

Update the `## Layout` block to name the new harness modules beside the existing entries.

- [ ] **Step 4: Correct the spec's tier-1 paragraph**

`docs/superpowers/specs/2026-07-25-testing-strategy-design.md`'s `## Tier 1: Unit Tests` section lists `parse/`
coverage as "document loading, `$ref` resolution, deref proxying, version detection". **There is no version detection
in `@goast/core`** — Swagger 2 versus OpenAPI 3 is handled structurally in `collect/collector.ts`, which reads
`document.definitions` beside `document.components.schemas` unconditionally and never inspects `document.openapi` or
`document.swagger`.

Replace "version detection" with an accurate description of the structural handling, and note where it lives. Verify
the claim yourself first:

```bash
grep -rn "\.openapi\b\|\.swagger\b" packages/core/src --include='*.ts' | grep -v '\.test\.ts'
```

If that finds a version check, the spec is right and this step is wrong — say so and leave the spec alone.

- [ ] **Step 5: Verify every citation**

Open every `path:line` and every test name you cited and confirm it says what your entry claims. Two register entries
in earlier phases carried line numbers that had drifted, and the controller cited a wrong line during phase 2b that an
implementer caught. Report any citation that did not hold and the correct value.

- [ ] **Step 6: Commit**

```bash
deno fmt --check
git add docs/superpowers/plans/2026-07-25-generator-bug-fixes.md test/README.md \
        docs/superpowers/specs/2026-07-25-testing-strategy-design.md
git commit -m "docs: register what tier 1 pinned and document the tier-1 convention"
```

---

## Out of scope, recorded rather than dropped

- **Fixing anything tier 1 pins.** Every finding is recorded in Task 12 and left unfixed, matching how phase 3 handled
  the compile gate's findings. `combineParameters` and `mergeDeep` in particular would change generated output, which
  would change tier-2 and tier-3 snapshots, which is a separate phase's work.
- **Coverage measurement.** No `deno coverage` threshold, no coverage gate in CI. The spec does not ask for one, and a
  percentage target rewards testing whatever is cheapest to reach rather than what is most likely to break.
- **Core `utils/`.** Eleven untested runtime files remain — `schema-factory.ts` (191 lines), `type.utils.ts` (93),
  `string-builder/utils.ts` (69), `asset-manager.ts` (50), `api-data.utils.ts` (48), `yaml-info.ts` (48),
  `class.utils.ts` (40), `string-builder/options.ts` (19), `array.utils.ts` (7), `error.utils.ts` (3), and
  `internal-utils.ts` (5). The owner scoped this phase to the spec's named directories plus the AST gaps. These are a
  candidate for a follow-up phase.
- **The AST `references/` and `utils/write-*` modules.** `references/*.ts` are coordinate constants with no logic;
  `utils/write-*.ts` are internal writers already exercised through every node test. Testing them directly would
  duplicate the node tests without adding a failure mode they cannot already catch.
- **Type-only files.** `parse/openapi-types.ts` (953 lines), `transform/api-types.ts` (250),
  `utils/string.utils.types.ts` (179) and the four `types.ts` files declare types with no runtime behaviour. `deno
  check` already validates them; a unit test could only assert that TypeScript works.
- **The URL branch of `getDocumentContent`.** Reachable only through `fetch`. A unit test hitting a real host would
  break the "Deno and Docker only" constraint and make tier 1 network-dependent. Task 7 covers the `isUrl` predicate
  through its observable branch instead.
- **CI wiring.** Phase 8 owns the workflow. Tier 1 already runs under `deno task test`, so no new job is needed.

## Halt conditions

Report BLOCKED rather than working around any of these:

- A convention sweep changes a test's assertion, not just its spelling. The sweep must be behaviour-preserving; a
  changed test count or a newly failing assertion means something else is going on.
- Any diff appears under `test/output/`, `test/specs/` or `test/compile/`. This phase does not touch them, and
  `deno task test:output:check` is the gate.
- A new test requires changing production code under `packages/` to pass. Tier 1 documents current behaviour; if the
  behaviour is wrong, register it (Task 12) and pin the actual value.
- `normalizeEOL` cannot be deleted in Task 4 because a caller remains outside this plan's scope.
- The `test/harness` → `@goast/core` dependency breaks `deno task npm:test-harness` and the Task 6 Step 1 fallback also
  fails.

## Self-review

**Spec coverage.** The spec's `## Tier 1: Unit Tests` section names six convention rules and four new-coverage
directories. The rules: `it` everywhere (Tasks 2-4, Step 2), `@std/expect` (Step 1), literal `\n` with `normalizeEOL`
removed (Task 1, Tasks 2-4 Steps 3-4, Task 4 Steps 8-10), one top-level `describe` per exported symbol colocated as
`<symbol-file>.test.ts` (Tasks 2-4 Step 5, and Task 4 Step 5 for the nine files that need it), and no `stub(fs, ...)`
(already satisfied — zero occurrences, verified). The directories: `parse/` (Tasks 6 and 7), `transform/` (Tasks 9 and
10), `collect/` (Task 8), `codegen/` (Task 11). The AST gaps (Task 5) are outside the spec's list and inside the
original request's "e.g. AST"; the owner scoped them in explicitly.

One spec claim this plan contradicts rather than implements: "version detection" in `parse/`. There is no such code.
Task 12 Step 4 corrects the spec instead of writing a test for a function that does not exist, and gates that
correction behind a grep so the plan cannot be wrong about it silently.

**Placeholder scan.** No TBDs. Four steps deliberately produce a measurement rather than transcribe one, and each names
its concrete output and what to do with either result: Task 5's expectations must be built from the builder's real
output; Task 6 Step 1 verifies the harness→core dependency and states the fallback; Task 8 Step 3's cycle test is a
finding if it hangs; Task 11 Steps 4 and 5 pin behaviour whose exact value is read off the run. Task 9 Step 4 and Task
11 Step 6 both instruct deleting a test rather than keeping a vacuous one — that is a decision with a stated criterion,
not a deferral.

**Type consistency.** `dedent(indentCharCount: number): (str: string) => string` is defined in Task 1 and consumed by
Tasks 2-5 under that exact signature. `derefAt(path, value, ref?)` and `derefSchemaAt(path, schema, ref?)` are defined
in Task 6 and consumed by Tasks 8-10 with `path` first, matching the extraction from `transform-schema.test.ts` whose
private helper had the same argument order. `createTransformerContext(options?, input?)` is defined in Task 9 and
consumed by Tasks 9 and 10. All three are exported from `@goast/test-harness` via `test/harness/mod.ts`, which Tasks 6
and 9 each extend. Task 4 depends on Tasks 2 and 3 having completed and says so in its Interfaces block; no other task
has an ordering constraint beyond Part 1 preceding Part 2.
