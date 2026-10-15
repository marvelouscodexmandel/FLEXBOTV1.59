import test from 'node:test';
import assert from 'node:assert/strict';
import { makeReply } from '../src/services/commands.js';

test('responds to ping', () => {
  assert.match(makeReply('!ping'), /Pong/);
});

test('unknown prefixed command is clearly rejected', () => {
  assert.match(makeReply('!does-not-exist'), /don’t recognise|don't recognise/i);
});

test('calculator handles arithmetic without accepting identifiers', () => {
  assert.match(makeReply('!calc 12*(4+3)'), /84/);
  assert.match(makeReply('!calc process.exit()'), /Usage/);
});

test('text utilities operate on supplied text', () => {
  assert.match(makeReply('!uppercase hello world'), /HELLO WORLD/);
  assert.match(makeReply('!reverse abc'), /cba/);
  assert.match(makeReply('!wordcount one two three'), /Words: 3/);
});

test('group helpers return useful prompts', () => {
  assert.match(makeReply('!study-explain photosynthesis'), /photosynthesis/i);
  assert.match(makeReply('!tech-debug-checklist server error'), /server error/i);
});

test('unconfigured external integrations are not falsely claimed to work', () => {
  assert.match(makeReply('!weather'), /not configured/i);
  assert.match(makeReply('!remindme tomorrow'), /not enabled yet/i);
});
