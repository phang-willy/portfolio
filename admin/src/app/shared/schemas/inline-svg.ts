const ALLOWED_ELEMENTS = new Set([
  'a',
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'g',
  'line',
  'lineargradient',
  'mask',
  'path',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'stop',
  'svg',
  'symbol',
  'text',
  'title',
  'tspan',
  'use',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'aria-hidden',
  'aria-label',
  'class',
  'clip-path',
  'clip-rule',
  'clippathunits',
  'color',
  'cx',
  'cy',
  'd',
  'display',
  'dominant-baseline',
  'dx',
  'dy',
  'fill',
  'fill-opacity',
  'fill-rule',
  'font-family',
  'font-size',
  'font-weight',
  'fx',
  'fy',
  'gradienttransform',
  'gradientunits',
  'height',
  'href',
  'id',
  'mask',
  'maskcontentunits',
  'maskunits',
  'offset',
  'opacity',
  'points',
  'preserveaspectratio',
  'r',
  'role',
  'rx',
  'ry',
  'spreadmethod',
  'stop-color',
  'stop-opacity',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'transform',
  'viewbox',
  'visibility',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
]);

const PAINT_ATTRIBUTES = new Set(['color', 'fill', 'mask', 'clip-path', 'stop-color', 'stroke']);

/** Stack icons may only point at a fragment in the same document. */
const ALLOWED_URL_PROTOCOLS = new Set(['fragment']);

const CANONICAL_ELEMENTS: Record<string, string> = {
  clippath: 'clipPath',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
};

const CANONICAL_ATTRIBUTES: Record<string, string> = {
  clippathunits: 'clipPathUnits',
  gradienttransform: 'gradientTransform',
  gradientunits: 'gradientUnits',
  maskcontentunits: 'maskContentUnits',
  maskunits: 'maskUnits',
  preserveaspectratio: 'preserveAspectRatio',
  spreadmethod: 'spreadMethod',
  viewbox: 'viewBox',
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  colon: ':',
  gt: '>',
  lt: '<',
  newline: '\n',
  quot: '"',
  tab: '\t',
};

type SvgAttribute = {
  name: string;
  value: string;
};

type SvgElement = {
  name: string;
  attrs: SvgAttribute[];
  children: Array<SvgElement | string>;
};

class SvgParseError extends Error {}

class Reader {
  index = 0;

  constructor(readonly source: string) {}

  get done(): boolean {
    return this.index >= this.source.length;
  }

  peek(): string {
    return this.source[this.index] ?? '';
  }

  startsWith(value: string): boolean {
    return this.source.startsWith(value, this.index);
  }

  consume(value: string): boolean {
    if (!this.startsWith(value)) {
      return false;
    }
    this.index += value.length;
    return true;
  }

  advance(count = 1): void {
    this.index += count;
  }
}

/** Returns stored stack SVG with only allowlisted elements, attributes, and URL protocols. */
export function sanitizeInlineSvg(value: string | null | undefined): string | null {
  return inspectInlineSvg(value)?.markup ?? null;
}

/** True when the markup is already an allowlisted static SVG and nothing would be removed. */
export function isSafeInlineSvg(value: string): boolean {
  const inspected = inspectInlineSvg(value);
  return inspected !== null && !inspected.dropped;
}

function inspectInlineSvg(
  value: string | null | undefined,
): { markup: string; dropped: boolean } | null {
  if (!value || !value.trim()) {
    return null;
  }

  try {
    const root = parseRoot(new Reader(value.trim()));
    const state = { dropped: false };
    const safe = sanitizeElement(root, state);
    if (!safe || localName(safe.name) !== 'svg') {
      return null;
    }
    return { markup: serialize(safe), dropped: state.dropped };
  } catch (error) {
    if (error instanceof SvgParseError) {
      return null;
    }
    throw error;
  }
}

function parseRoot(reader: Reader): SvgElement {
  let root: SvgElement | null = null;
  while (!reader.done) {
    skipIgnorable(reader);
    if (reader.done) {
      break;
    }
    if (reader.peek() !== '<') {
      throw new SvgParseError('Unexpected text');
    }
    if (root) {
      throw new SvgParseError('Multiple roots');
    }
    root = parseElement(reader);
  }
  if (!root || localName(root.name) !== 'svg') {
    throw new SvgParseError('Missing svg root');
  }
  return root;
}

function parseElement(reader: Reader): SvgElement {
  if (!reader.consume('<') || reader.peek() === '/' || reader.peek() === '!') {
    throw new SvgParseError('Invalid tag');
  }

  const name = readName(reader);
  const attrs: SvgAttribute[] = [];
  while (!reader.done) {
    skipWhitespace(reader);
    if (reader.startsWith('/>') || reader.peek() === '>') {
      break;
    }
    const attributeName = readName(reader);
    skipWhitespace(reader);
    let rawValue = '';
    if (reader.consume('=')) {
      skipWhitespace(reader);
      rawValue = readAttributeValue(reader);
    }
    attrs.push({ name: attributeName, value: rawValue });
  }

  if (reader.consume('/>')) {
    return { name, attrs, children: [] };
  }
  if (!reader.consume('>')) {
    throw new SvgParseError('Unclosed tag');
  }

  const children: Array<SvgElement | string> = [];
  while (!reader.done) {
    if (reader.startsWith('</')) {
      reader.advance(2);
      const closeName = readName(reader);
      skipWhitespace(reader);
      if (!reader.consume('>') || localName(closeName) !== localName(name)) {
        throw new SvgParseError('Mismatched tag');
      }
      return { name, attrs, children };
    }
    if (reader.startsWith('<')) {
      skipIgnorable(reader);
      if (reader.startsWith('</') || reader.done) {
        continue;
      }
      if (reader.peek() !== '<') {
        continue;
      }
      children.push(parseElement(reader));
      continue;
    }
    const text = readText(reader);
    if (text) {
      children.push(text);
    }
  }
  throw new SvgParseError('Unclosed element');
}

function skipIgnorable(reader: Reader): void {
  while (!reader.done) {
    if (reader.startsWith('<!--')) {
      const end = reader.source.indexOf('-->', reader.index + 4);
      if (end < 0) {
        throw new SvgParseError('Unclosed comment');
      }
      reader.index = end + 3;
      continue;
    }
    if (reader.startsWith('<?')) {
      const end = reader.source.indexOf('?>', reader.index + 2);
      if (end < 0) {
        throw new SvgParseError('Unclosed declaration');
      }
      reader.index = end + 2;
      continue;
    }
    if (reader.startsWith('<!')) {
      throw new SvgParseError('Unsupported declaration');
    }
    if (isWhitespace(reader.peek())) {
      reader.advance();
      continue;
    }
    break;
  }
}

function readName(reader: Reader): string {
  const start = reader.index;
  if (!/[A-Za-z_:]/.test(reader.peek())) {
    throw new SvgParseError('Invalid name');
  }
  reader.advance();
  while (/[A-Za-z0-9_.:-]/.test(reader.peek())) {
    reader.advance();
  }
  return reader.source.slice(start, reader.index);
}

function readAttributeValue(reader: Reader): string {
  const quote = reader.peek();
  if (quote === '"' || quote === "'") {
    reader.advance();
    const start = reader.index;
    while (!reader.done && reader.peek() !== quote) {
      reader.advance();
    }
    if (reader.done) {
      throw new SvgParseError('Unclosed attribute');
    }
    const value = reader.source.slice(start, reader.index);
    reader.advance();
    return value;
  }

  const start = reader.index;
  while (!reader.done && !isWhitespace(reader.peek()) && reader.peek() !== '>') {
    if (reader.startsWith('/>')) {
      break;
    }
    reader.advance();
  }
  if (start === reader.index) {
    throw new SvgParseError('Missing attribute value');
  }
  return reader.source.slice(start, reader.index);
}

function readText(reader: Reader): string {
  const start = reader.index;
  while (!reader.done && reader.peek() !== '<') {
    reader.advance();
  }
  return reader.source.slice(start, reader.index);
}

function sanitizeElement(element: SvgElement, state: { dropped: boolean }): SvgElement | null {
  const local = localName(element.name);
  if (!ALLOWED_ELEMENTS.has(local)) {
    state.dropped = true;
    return null;
  }

  const attrs: SvgAttribute[] = [];
  for (const attribute of element.attrs) {
    const kept = keepAttribute(attribute);
    if (!kept) {
      state.dropped = true;
      continue;
    }
    attrs.push(kept);
  }

  const children: Array<SvgElement | string> = [];
  for (const child of element.children) {
    if (typeof child === 'string') {
      const decoded = decodeEntities(child);
      if (decoded.includes('\0')) {
        state.dropped = true;
        continue;
      }
      if (decoded) {
        children.push(decoded);
      }
      continue;
    }
    const safeChild = sanitizeElement(child, state);
    if (safeChild) {
      children.push(safeChild);
    }
  }

  return {
    name: CANONICAL_ELEMENTS[local] ?? local,
    attrs,
    children,
  };
}

function keepAttribute(attribute: SvgAttribute): SvgAttribute | null {
  const { prefix, local } = splitName(attribute.name);
  const prefixLower = prefix.toLowerCase();
  const localLower = local.toLowerCase();
  const decoded = decodeEntities(attribute.value);
  if (decoded.includes('\0') || decoded.includes('<') || decoded.includes('>')) {
    return null;
  }

  if (prefixLower === 'xmlns' && localLower === 'xlink') {
    return decoded === 'http://www.w3.org/1999/xlink'
      ? { name: 'xmlns:xlink', value: decoded }
      : null;
  }
  if (!prefixLower && localLower === 'xmlns') {
    return decoded === 'http://www.w3.org/2000/svg' ? { name: 'xmlns', value: decoded } : null;
  }
  if (prefixLower === 'xlink' && localLower === 'href') {
    return isAllowedReference(decoded) ? { name: 'href', value: compactReference(decoded) } : null;
  }
  if (!ALLOWED_ATTRIBUTES.has(localLower)) {
    return null;
  }
  if (localLower === 'href') {
    return isAllowedReference(decoded) ? { name: 'href', value: compactReference(decoded) } : null;
  }
  if (PAINT_ATTRIBUTES.has(localLower) || /url\s*\(/i.test(decoded)) {
    return isSafePaint(decoded)
      ? { name: CANONICAL_ATTRIBUTES[localLower] ?? localLower, value: decoded.trim() }
      : null;
  }
  if (hasAbsoluteUrl(whitespaceStripped(decoded)) || decoded.includes('&')) {
    return null;
  }
  return {
    name: CANONICAL_ATTRIBUTES[localLower] ?? localLower,
    value: decoded,
  };
}

function isSafePaint(decoded: string): boolean {
  if (decoded.includes('&') || decoded.includes('<') || decoded.includes('>')) {
    return false;
  }
  let blocked = false;
  const rest = whitespaceStripped(decoded).replace(/url\(([^)]*)\)/gi, (_, inner: string) => {
    if (!isAllowedReference(inner)) {
      blocked = true;
    }
    return '';
  });
  return !blocked && !hasAbsoluteUrl(rest);
}

function isAllowedReference(value: string): boolean {
  const compact = compactReference(value);
  if (!compact || compact.includes('&') || compact.includes('<') || compact.includes('>')) {
    return false;
  }
  if (compact.startsWith('#')) {
    return ALLOWED_URL_PROTOCOLS.has('fragment') && /^#[A-Za-z_][\w.-]*$/.test(compact);
  }
  try {
    return ALLOWED_URL_PROTOCOLS.has(new URL(compact).protocol);
  } catch {
    return false;
  }
}

function compactReference(value: string): string {
  return whitespaceStripped(value).replace(/^['"]|['"]$/g, '');
}

function hasAbsoluteUrl(compact: string): boolean {
  if (!compact) {
    return false;
  }
  try {
    new URL(compact);
    return true;
  } catch {
    return /^[a-z][a-z0-9+.-]*:/i.test(compact);
  }
}

function whitespaceStripped(value: string): string {
  return value.replace(/[\u0000-\u0020]+/g, '');
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]+);?/gi, (entity, body: string) => {
    const token = body.toLowerCase();
    if (token.startsWith('#x')) {
      return codePoint(Number.parseInt(token.slice(2), 16)) ?? entity;
    }
    if (token.startsWith('#')) {
      return codePoint(Number.parseInt(token.slice(1), 10)) ?? entity;
    }
    if (!entity.endsWith(';')) {
      return entity;
    }
    return NAMED_ENTITIES[token] ?? entity;
  });
}

function codePoint(code: number): string | null {
  if (
    !Number.isInteger(code) ||
    code <= 0 ||
    code > 0x10ffff ||
    (code >= 0xd800 && code <= 0xdfff)
  ) {
    return null;
  }
  return String.fromCodePoint(code);
}

function serialize(element: SvgElement): string {
  const attrs = element.attrs
    .map((attribute) => ` ${attribute.name}="${escapeAttribute(attribute.value)}"`)
    .join('');
  const children = element.children.filter((child) => child !== '');
  if (children.length === 0) {
    return `<${element.name}${attrs}/>`;
  }
  const inner = children
    .map((child) => (typeof child === 'string' ? escapeText(child) : serialize(child)))
    .join('');
  return `<${element.name}${attrs}>${inner}</${element.name}>`;
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function splitName(name: string): { prefix: string; local: string } {
  const colon = name.indexOf(':');
  if (colon < 0) {
    return { prefix: '', local: name };
  }
  return { prefix: name.slice(0, colon), local: name.slice(colon + 1) };
}

function localName(name: string): string {
  return splitName(name).local.toLowerCase();
}

function skipWhitespace(reader: Reader): void {
  while (isWhitespace(reader.peek())) {
    reader.advance();
  }
}

function isWhitespace(value: string): boolean {
  return value === ' ' || value === '\n' || value === '\r' || value === '\t' || value === '\f';
}
