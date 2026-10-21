import { test } from 'node:test';
import assert from 'node:assert/strict';
import { broadcastName } from './newsletter-broadcast-name.mjs';

test('preserves existing names up to the 70-character boundary', () => {
  for (const length of [1, 56, 57]) {
    const slug = 'x'.repeat(length);
    assert.equal(broadcastName('YEWsletter', slug), `YEWsletter — ${slug}`);
  }
});

test('bounds the failing issue name and keeps its identity stable on retries', () => {
  const slug = '2026-10-see-yew-on-the-dance-floor-yewsletter-for-10-21-26';
  const name = broadcastName('YEWsletter', slug);
  assert.equal(name.length, 70);
  assert.equal(name, broadcastName('YEWsletter', slug));
  assert.notEqual(name, broadcastName('YEWsletter', `${slug}-another`));
});

test('distinguishes long issues with the same truncated prefix', () => {
  const prefix = 'x'.repeat(200);
  const first = broadcastName('YEWsletter', `${prefix}-first`);
  const second = broadcastName('YEWsletter', `${prefix}-second`);
  assert.equal(first.length, 70);
  assert.equal(second.length, 70);
  assert.notEqual(first, second);
});
