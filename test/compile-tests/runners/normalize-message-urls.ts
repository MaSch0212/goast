import { posix, win32 } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/** Any `file://` URL embedded free-form in diagnostic text, stopping at whitespace or a quote. */
const EMBEDDED_URL = /file:\/\/[^\s"'<>]+/g;

/** A Windows drive-absolute path such as `C:/foo` or `C:\foo`, as opposed to a POSIX `/foo`. */
function isWindowsDrivePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path);
}

/**
 * Decodes a `file://` URL to a plain absolute path, in whichever OS flavor the URL itself encodes: a
 * Windows drive path (`C:/foo/bar`) or a POSIX path (`/foo/bar`).
 *
 * Deliberately uses the WHATWG `URL` parser rather than `node:url`'s `fileURLToPath`, which refuses to
 * parse a *foreign*-OS URL on whichever host actually runs it — a POSIX-style URL throws `TypeError:
 * File URL path must be absolute` under Node/Deno on Windows, and the reverse is true on POSIX. That
 * host-coupling is exactly the property that made the original bug possible (see
 * {@link normalizeMessageUrls}'s doc comment): whichever host captured a diagnostic, its URL flavor
 * matched that host, and a later, differently-hosted comparison disagreed on it. Parsing manually here
 * keeps the conversion itself independent of which OS is running it, which is what lets a single test
 * process exercise both the Windows-drive and the POSIX branch and confirm they agree.
 */
function decodeFileUrl(url: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'file:') return undefined;

  const pathname = decodeURIComponent(parsed.pathname);
  // A Windows drive path is URL-encoded with a leading `/` before the drive letter (`/C:/foo`) because
  // a URL path always starts with `/`; a POSIX path's leading `/` already *is* its root, so only the
  // Windows form has one to strip.
  const withoutLeadingSlash = pathname.slice(1);
  return isWindowsDrivePath(withoutLeadingSlash) ? withoutLeadingSlash : pathname;
}

/**
 * Rewrites every `file://` URL embedded in a diagnostic's message to the same portable form
 * `relativizeDiagnostic` (from `@goast/test-harness`) already gives the diagnostic's own `file` field:
 * unit-relative and forward-slashed when the URL points inside the unit's tree, `<root>/`-prefixed and
 * repo-relative when it points elsewhere inside the checkout, and left untouched otherwise — a path
 * outside the repo entirely (not expected in this corpus, but not assumed impossible), or one that
 * resolves onto a different drive than the checkout (no relative path exists between them; `isAbsolute`
 * catches this, since `path.relative` across Windows drives returns the target unchanged rather than a
 * `..`-prefixed climb).
 *
 * `relativizeDiagnostic` only rewrites the structured `file` field. A `deno check` message can carry
 * its own `file://` URL too — `TS2307`'s `not a dependency and not in import map from "file://…"`
 * clause does — and that URL would otherwise survive into the committed snapshot as raw text. The
 * later repo-root normalization pass (`normalizePaths`, run by `verifyText`) matches the checkout root
 * against literal text, and a `file://` URL's boundary with the root differs by platform: on Windows
 * the root has no leading separator of its own (`E:\...`), so `file:///E:/...` leaves `file:///`
 * before the match; on POSIX the root already starts with `/` (`/home/...`), so `file:///home/...`
 * leaves only `file://` before the match — one committed snapshot, two different literal strings for
 * the identical path, depending on which platform captured it. Converting the URL to a real path here,
 * before this text is ever formatted or normalized, removes the ambiguity instead of asking two
 * separate normalizers — one general-purpose, one specific to this runner — to agree on it.
 */
export function normalizeMessageUrls(message: string, treeDir: string): string {
  return message.replace(EMBEDDED_URL, (url) => {
    const absolute = decodeFileUrl(url);
    if (absolute === undefined) return url;

    const impl = isWindowsDrivePath(absolute) ? win32 : posix;

    const relToTree = impl.relative(treeDir, absolute);
    if (relToTree !== '' && !relToTree.startsWith('..') && !impl.isAbsolute(relToTree)) {
      return relToTree.replace(/\\/g, '/');
    }

    const relToRoot = impl.relative(repoRootDir, absolute);
    if (relToRoot !== '' && !relToRoot.startsWith('..') && !impl.isAbsolute(relToRoot)) {
      return `<root>/${relToRoot.replace(/\\/g, '/')}`;
    }

    return url;
  });
}
