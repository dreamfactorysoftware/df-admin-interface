/**
 * Parses a cURL command line into the pieces an HTTP (rws) service config needs.
 *
 * The mapping onto `rws_config` is:
 *   URL without query   -> base_url
 *   query string        -> rws_parameters_config rows (outbound)
 *   -H / -A / -e / -b   -> rws_headers_config rows
 *   -X                  -> the verb mask applied to the generated rows
 *   -u / -k / -x / ...  -> CURL options object
 *
 * A request body (-d / -F) has nowhere to live in an rws service, which is a
 * pass-through proxy: the body comes from the caller at request time. It is
 * still returned so the caller can show it, but it is never written to config.
 */

export interface CurlKeyValue {
  name: string;
  value: string;
}

export interface ParsedCurl {
  /** Origin + path, with the query string stripped off. */
  baseUrl: string;
  /** Uppercase HTTP verb. Defaults to GET, or POST when a body is present. */
  method: string;
  /** Query string pairs, in the order they appeared. */
  parameters: CurlKeyValue[];
  /** Request headers, in the order they appeared. */
  headers: CurlKeyValue[];
  /** CURL options keyed by PHP constant name, e.g. `CURLOPT_PROXY`. */
  options: Record<string, string>;
  /** Request body, if the command carried one. Not stored in service config. */
  body?: string;
  /** Things that were dropped or need the user's attention. */
  warnings: string[];
}

export class CurlParseError extends Error {}

/** Flags that take no argument and have no bearing on service config. */
const IGNORED_BOOLEAN_FLAGS = new Set([
  '-s',
  '--silent',
  '-S',
  '--show-error',
  '-v',
  '--verbose',
  '-i',
  '--include',
  '-f',
  '--fail',
  '-#',
  '--progress-bar',
  '-N',
  '--no-buffer',
  '-g',
  '--globoff',
  '-4',
  '--ipv4',
  '-6',
  '--ipv6',
  '--no-progress-meter',
]);

/** Flags that take one argument we do not care about. */
const IGNORED_VALUE_FLAGS = new Set([
  '-o',
  '--output',
  '-w',
  '--write-out',
  '-D',
  '--dump-header',
  '--trace',
  '--trace-ascii',
  '--stderr',
]);

const BODY_FLAGS = new Set([
  '-d',
  '--data',
  '--data-raw',
  '--data-ascii',
  '--data-binary',
  '--data-urlencode',
]);

/**
 * Splits a command line into tokens using POSIX-ish shell quoting rules:
 * single quotes are literal, double quotes honour backslash escapes, and a
 * backslash before a newline continues the line.
 */
export function tokenizeCurl(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let hasCurrent = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === "'") {
      const end = input.indexOf("'", i + 1);
      if (end === -1) {
        throw new CurlParseError('Unterminated single quote in command.');
      }
      current += input.slice(i + 1, end);
      hasCurrent = true;
      i = end + 1;
      continue;
    }

    if (char === '"') {
      i++;
      let closed = false;
      while (i < input.length) {
        if (input[i] === '\\' && i + 1 < input.length) {
          const next = input[i + 1];
          // Inside double quotes a backslash only escapes these characters.
          current += '\\$`"\n'.includes(next) ? next : '\\' + next;
          i += 2;
          continue;
        }
        if (input[i] === '"') {
          closed = true;
          i++;
          break;
        }
        current += input[i];
        i++;
      }
      if (!closed) {
        throw new CurlParseError('Unterminated double quote in command.');
      }
      hasCurrent = true;
      continue;
    }

    if (char === '\\' && i + 1 < input.length) {
      const next = input[i + 1];
      if (next === '\n' || next === '\r') {
        // Line continuation: skip the backslash and the newline.
        i += next === '\r' && input[i + 2] === '\n' ? 3 : 2;
        continue;
      }
      current += next;
      hasCurrent = true;
      i += 2;
      continue;
    }

    if (/\s/.test(char)) {
      if (hasCurrent) {
        tokens.push(current);
        current = '';
        hasCurrent = false;
      }
      i++;
      continue;
    }

    // A caret at end-of-line is the Windows cmd.exe line continuation.
    if (char === '^' && (input[i + 1] === '\n' || input[i + 1] === '\r')) {
      i++;
      continue;
    }

    current += char;
    hasCurrent = true;
    i++;
  }

  if (hasCurrent) {
    tokens.push(current);
  }
  return tokens;
}

function splitHeader(raw: string): CurlKeyValue | null {
  // `-H 'Name;'` is curl's way of sending an empty header.
  if (raw.endsWith(';') && !raw.includes(':')) {
    return { name: raw.slice(0, -1).trim(), value: '' };
  }
  const separator = raw.indexOf(':');
  if (separator === -1) {
    return null;
  }
  const name = raw.slice(0, separator).trim();
  if (!name) {
    return null;
  }
  return { name, value: raw.slice(separator + 1).trim() };
}

/**
 * Pulls the query string off a URL and returns the bare URL plus its pairs.
 * Falls back to manual splitting when the URL is not absolute.
 */
function splitUrl(rawUrl: string): {
  baseUrl: string;
  parameters: CurlKeyValue[];
} {
  const parameters: CurlKeyValue[] = [];
  const hashIndex = rawUrl.indexOf('#');
  const withoutFragment =
    hashIndex === -1 ? rawUrl : rawUrl.slice(0, hashIndex);
  const queryIndex = withoutFragment.indexOf('?');

  if (queryIndex === -1) {
    return { baseUrl: withoutFragment, parameters };
  }

  const baseUrl = withoutFragment.slice(0, queryIndex);
  const query = withoutFragment.slice(queryIndex + 1);

  for (const pair of query.split('&')) {
    if (!pair) {
      continue;
    }
    const equals = pair.indexOf('=');
    const name = equals === -1 ? pair : pair.slice(0, equals);
    const value = equals === -1 ? '' : pair.slice(equals + 1);
    parameters.push({
      name: safeDecode(name),
      value: safeDecode(value),
    });
  }

  return { baseUrl, parameters };
}

/**
 * Base64-encodes `user:password` for an Authorization header. `btoa` only
 * accepts latin1, so non-ASCII credentials are widened to UTF-8 bytes first --
 * matching what curl puts on the wire. encodeURIComponent is used for that
 * rather than TextEncoder, which is not a global in every test environment.
 */
function encodeBasicAuth(credentials: string): string {
  const utf8Bytes = encodeURIComponent(credentials).replace(
    /%([0-9A-F]{2})/gi,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(utf8Bytes);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    // Malformed percent-encoding: keep the literal text rather than failing.
    return value;
  }
}

export function parseCurl(input: string): ParsedCurl {
  const trimmed = (input ?? '').trim();
  if (!trimmed) {
    throw new CurlParseError('Enter a cURL command.');
  }

  const tokens = tokenizeCurl(trimmed);
  if (!tokens.length) {
    throw new CurlParseError('Enter a cURL command.');
  }
  if (tokens[0].toLowerCase() !== 'curl') {
    throw new CurlParseError('Command must start with "curl".');
  }

  const headers: CurlKeyValue[] = [];
  const options: Record<string, string> = {};
  const warnings: string[] = [];
  const bodyParts: string[] = [];
  const urls: string[] = [];
  let explicitMethod = '';
  let basicAuth = '';
  let forceGet = false;
  let isMultipart = false;

  // Returns the argument for a flag, supporting both `-H value` and `-Hvalue`.
  let index = 1;
  const takeValue = (flag: string, inlineValue?: string): string => {
    if (inlineValue !== undefined) {
      return inlineValue;
    }
    index++;
    if (index >= tokens.length) {
      throw new CurlParseError(`Missing value for ${flag}.`);
    }
    return tokens[index];
  };

  for (; index < tokens.length; index++) {
    const token = tokens[index];

    if (!token.startsWith('-')) {
      urls.push(token);
      continue;
    }

    // Normalise `--flag=value` and short-flag-with-attached-value forms.
    let flag = token;
    let inline: string | undefined;
    const equals = token.indexOf('=');
    if (token.startsWith('--') && equals !== -1) {
      flag = token.slice(0, equals);
      inline = token.slice(equals + 1);
    } else if (
      !token.startsWith('--') &&
      token.length > 2 &&
      'HXduexAebm'.includes(token[1])
    ) {
      flag = token.slice(0, 2);
      inline = token.slice(2);
    }

    if (IGNORED_BOOLEAN_FLAGS.has(flag)) {
      continue;
    }
    if (IGNORED_VALUE_FLAGS.has(flag)) {
      takeValue(flag, inline);
      continue;
    }
    if (BODY_FLAGS.has(flag)) {
      bodyParts.push(takeValue(flag, inline));
      continue;
    }

    switch (flag) {
      case '-X':
      case '--request':
        explicitMethod = takeValue(flag, inline).toUpperCase();
        break;

      case '-H':
      case '--header': {
        const header = splitHeader(takeValue(flag, inline));
        if (header) {
          headers.push(header);
        } else {
          warnings.push(`Skipped a header that could not be parsed.`);
        }
        break;
      }

      case '--url':
        urls.push(takeValue(flag, inline));
        break;

      case '-u':
      case '--user':
        basicAuth = takeValue(flag, inline);
        break;

      case '-A':
      case '--user-agent':
        headers.push({ name: 'User-Agent', value: takeValue(flag, inline) });
        break;

      case '-e':
      case '--referer':
        headers.push({ name: 'Referer', value: takeValue(flag, inline) });
        break;

      case '-b':
      case '--cookie':
        headers.push({ name: 'Cookie', value: takeValue(flag, inline) });
        break;

      case '-k':
      case '--insecure':
        options['CURLOPT_SSL_VERIFYPEER'] = '0';
        options['CURLOPT_SSL_VERIFYHOST'] = '0';
        break;

      case '-L':
      case '--location':
        options['CURLOPT_FOLLOWLOCATION'] = '1';
        break;

      case '-x':
      case '--proxy':
        options['CURLOPT_PROXY'] = takeValue(flag, inline);
        break;

      case '-U':
      case '--proxy-user':
        options['CURLOPT_PROXYUSERPWD'] = takeValue(flag, inline);
        break;

      case '--connect-timeout':
        options['CURLOPT_CONNECTTIMEOUT'] = takeValue(flag, inline);
        break;

      case '-m':
      case '--max-time':
        options['CURLOPT_TIMEOUT'] = takeValue(flag, inline);
        break;

      case '--compressed':
        options['CURLOPT_ENCODING'] = '';
        break;

      case '-G':
      case '--get':
        forceGet = true;
        break;

      case '-I':
      case '--head':
        explicitMethod = explicitMethod || 'HEAD';
        break;

      case '-F':
      case '--form':
        isMultipart = true;
        bodyParts.push(takeValue(flag, inline));
        break;

      default:
        warnings.push(`Ignored unsupported option "${flag}".`);
        // Consume an attached value so it is not mistaken for the URL.
        if (
          inline === undefined &&
          tokens[index + 1]?.startsWith('-') === false
        ) {
          const lookahead = tokens[index + 1];
          if (lookahead && !/^[a-z][a-z0-9+.-]*:\/\//i.test(lookahead)) {
            index++;
          }
        }
        break;
    }
  }

  if (!urls.length) {
    throw new CurlParseError('No URL found in the command.');
  }
  if (urls.length > 1) {
    warnings.push(
      `Command contains ${urls.length} URLs; only the first was imported.`
    );
  }

  const { baseUrl, parameters } = splitUrl(urls[0]);
  if (!baseUrl) {
    throw new CurlParseError('No URL found in the command.');
  }

  // Warn when the URL carries a scheme other than http/https. curl accepts
  // file:, gopher:, dict: and similar, which an rws service will then send
  // server-side. Those can read local files or reach internal hosts. This is
  // a warning, not a block: the manual base_url field accepts any value too,
  // and schemeless or relative base URLs stay valid. The match needs a slash
  // after the colon so a schemeless host:port (e.g. localhost:8080) is left
  // alone.
  const schemeMatch = baseUrl.match(/^([a-z][a-z0-9+.-]*):(?=\/)/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      warnings.push(
        `The URL uses the "${scheme}" scheme, not http or https. The service ` +
          `sends requests with that scheme server-side, which can read local ` +
          `files or reach internal hosts. Import only if you trust the source.`
      );
    }
  }

  const body = bodyParts.length ? bodyParts.join('&') : undefined;

  // `-G` moves the body into the query string.
  if (forceGet && body) {
    for (const pair of body.split('&')) {
      if (!pair) {
        continue;
      }
      const equals = pair.indexOf('=');
      parameters.push({
        name: safeDecode(equals === -1 ? pair : pair.slice(0, equals)),
        value: safeDecode(equals === -1 ? '' : pair.slice(equals + 1)),
      });
    }
  }

  let method = explicitMethod;
  if (!method) {
    method = body && !forceGet ? 'POST' : 'GET';
  }

  if (isMultipart) {
    warnings.push(
      'Multipart form fields (-F) cannot be stored on an HTTP service and were not imported.'
    );
  } else if (body && !forceGet) {
    warnings.push(
      'The request body was not imported. An HTTP service passes through the body it receives at request time.'
    );
  }

  if (basicAuth) {
    // An explicit -H Authorization wins, which is how curl itself behaves.
    const hasAuthHeader = headers.some(
      header => header.name.toLowerCase() === 'authorization'
    );
    if (hasAuthHeader) {
      warnings.push(
        'Credentials from -u were ignored because the command already sets an Authorization header.'
      );
    } else {
      headers.push({
        name: 'Authorization',
        value: `Basic ${encodeBasicAuth(basicAuth)}`,
      });
      warnings.push(
        'Credentials from -u were imported as an Authorization header. Base64 is encoding, not encryption, so they are stored in a recoverable form.'
      );
    }
  }

  return {
    baseUrl,
    method,
    parameters,
    headers,
    options,
    body: forceGet ? undefined : body,
    warnings,
  };
}
