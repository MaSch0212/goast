import { cs } from '../../../ast/index.ts';
import type { CSharpFileBuilder } from '../../../file-builder.ts';
import type { SupportClass } from '../shared/index.ts';

/** Removes the common indentation of a block of code and its surrounding blank lines. */
function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  const indent = Math.min(...lines.filter((x) => x.trim() !== '').map((x) => x.length - x.trimStart().length));
  return lines.map((x) => x.slice(indent)).join('\n');
}

const code = (strings: TemplateStringsArray, ...substitutions: string[]): string =>
  dedent(String.raw({ raw: strings.raw }, ...substitutions));

/**
 * The raw request values the generated endpoints hand to the shared `ApiRequestSupport` conversions. FastEndpoints
 * is not asked to bind anything (its binding would change what is accepted on the wire), so the values are read from
 * the `HttpRequest` here, the way MVC's value providers would present them: the first value of a key, and an empty
 * value as absent.
 */
export function buildApiEndpointSupportClass(name: string, exceptionName: string): SupportClass {
  const declaration = cs.class<CSharpFileBuilder>(name, {
    doc: cs.doc('Reads the raw values of a request for the generated endpoints.'),
    accessModifier: 'public',
    static: true,
    members: [
      code`
        /// <summary>The value of a route parameter, or <c>null</c> if the route has none of that name.</summary>
        public static string? Route(HttpRequest request, string name)
        {
            return request.RouteValues.TryGetValue(name, out var value)
                ? Convert.ToString(value, CultureInfo.InvariantCulture)
                : null;
        }
      `,
      code`
        /// <summary>The first value of a query key. An empty value is absent.</summary>
        public static string? Query(HttpRequest request, string name)
        {
            return First(request.Query.TryGetValue(name, out var values) ? values : default);
        }
      `,
      code`
        /// <summary>
        /// Every value of a query key. An optional parameter without any value is absent (<c>null</c>), a required one
        /// is an empty array.
        /// </summary>
        public static string[]? QueryValues(HttpRequest request, string name, bool required)
        {
            return All(request.Query.TryGetValue(name, out var values) ? values : default, required);
        }
      `,
      code`
        /// <summary>The value of a header, several values joined by a comma. An empty value is absent.</summary>
        public static string? Header(HttpRequest request, string name)
        {
            var text = request.Headers.TryGetValue(name, out var values) ? values.ToString() : null;
            return string.IsNullOrEmpty(text) ? null : text;
        }
      `,
      code`
        /// <summary>Reads the request as a form. A request of any other content type cannot be bound.</summary>
        public static async Task<IFormCollection> ReadFormAsync(HttpRequest request, CancellationToken cancellationToken)
        {
            if (!request.HasFormContentType)
            {
                throw new ${exceptionName}($"The content type '{request.ContentType}' is not supported.", StatusCodes.Status415UnsupportedMediaType);
            }

            return await request.ReadFormAsync(cancellationToken);
        }
      `,
      code`
        /// <summary>The first value of a form field. An empty value is absent.</summary>
        public static string? FormValue(IFormCollection form, string name)
        {
            return First(form.TryGetValue(name, out var values) ? values : default);
        }
      `,
      code`
        /// <summary>
        /// Every value of a form field. An optional field without any value is absent (<c>null</c>), a required one is
        /// an empty array.
        /// </summary>
        public static string[]? FormValues(IFormCollection form, string name, bool required)
        {
            return All(form.TryGetValue(name, out var values) ? values : default, required);
        }
      `,
      code`
        /// <summary>The uploaded file of a form field, or <c>null</c> if there is none.</summary>
        public static IFormFile? FormFile(IFormCollection form, string name)
        {
            return form.Files.GetFile(name);
        }
      `,
      code`
        /// <summary>
        /// The uploaded files of a form field. An optional field without any file is absent (<c>null</c>), a required one
        /// is an empty collection.
        /// </summary>
        public static IFormFileCollection? FormFiles(IFormCollection form, string name, bool required)
        {
            var files = form.Files.GetFiles(name);
            if (files.Count == 0 && !required)
            {
                return null;
            }

            var result = new FormFileCollection();
            result.AddRange(files);
            return result;
        }
      `,
      code`
        private static string? First(StringValues values)
        {
            return values.Count > 0 && !string.IsNullOrEmpty(values[0]) ? values[0] : null;
        }
      `,
      code`
        private static string[]? All(StringValues values, bool required)
        {
            return values.Count == 0 && !required ? null : values.Where(x => x is not null).Select(x => x!).ToArray();
        }
      `,
    ],
  });
  return {
    name,
    declaration,
    usings: [
      'System',
      'System.Globalization',
      'System.Linq',
      'System.Threading',
      'System.Threading.Tasks',
      'Microsoft.AspNetCore.Http',
      'Microsoft.Extensions.Primitives',
    ],
  };
}
