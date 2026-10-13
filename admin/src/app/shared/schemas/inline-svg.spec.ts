import { describe, expect, it } from 'vitest';

import { isSafeInlineSvg, sanitizeInlineSvg } from './inline-svg';

describe('inline svg sanitizer', () => {
  it('keeps a static icon', () => {
    const markup = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h8v8z"/></svg>';
    expect(isSafeInlineSvg(markup)).toBe(true);
    expect(sanitizeInlineSvg(markup)).toBe(markup);
  });

  it('rejects a tab-obfuscated javascript url and strips it before render', () => {
    const markup = '<svg><a href="java&#x09;script:alert(1)">x</a></svg>';
    expect(isSafeInlineSvg(markup)).toBe(false);
    expect(sanitizeInlineSvg(markup)).toBe('<svg><a>x</a></svg>');
  });
});
