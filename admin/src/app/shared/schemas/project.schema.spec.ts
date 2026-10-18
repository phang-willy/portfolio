import { describe, expect, it } from 'vitest';

import { projectFormSchema } from './project.schema';

const locale = {
  title: 'Geolock',
  description: 'Vehicle tracking',
  content: '',
  imageAlt: 'Geolock',
};

function parseLinks(productionLink: string, sourceCodeLink: string) {
  return projectFormSchema.safeParse({
    slug: 'geolock',
    fr: locale,
    en: locale,
    stackIds: [],
    productionLink,
    sourceCodeLink,
    imageLink: '',
  });
}

describe('project form links', () => {
  it('accepts an empty link and an http(s) url', () => {
    expect(parseLinks('', 'https://phangwilly.com').success).toBe(true);
    expect(parseLinks('HTTP://github.com/phang-willy/portfolio', '').success).toBe(true);
  });

  it('rejects a bare scheme, spaces, and a non-http scheme', () => {
    expect(parseLinks('https://', '').success).toBe(false);
    expect(parseLinks('https://example.com/a b', '').success).toBe(false);
    expect(parseLinks('javascript:alert(1)', 'https://phangwilly.com').success).toBe(false);
  });
});
