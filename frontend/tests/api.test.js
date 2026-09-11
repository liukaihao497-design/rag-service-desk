import test from 'node:test'
import assert from 'node:assert/strict'
import { readSse, requestJson, askFiltered } from '../src/api.js'

test('SSE preserves Chinese, spaces and multiline events across arbitrary byte boundaries', async () => {
  const bytes = new TextEncoder().encode(': ping\r\ndata: 你\r\n\r\ndata:  \n\ndata: 好\ndata: 世界\n\n')
  const stream = new ReadableStream({ start(c) { for (const byte of bytes) c.enqueue(new Uint8Array([byte])); c.close() } })
  const parts = []
  await readSse(stream, value => parts.push(value))
  assert.deepEqual(parts, ['你', ' ', '好\n世界'])
})

test('SSE recognizes final unterminated event and stops at EOF', async () => {
  const stream = new Response('data: 完成').body
  const parts = []
  await readSse(stream, value => parts.push(value))
  assert.deepEqual(parts, ['完成'])
})

test('HTTP success with business failure is not reported as successful', async () => {
  await assert.rejects(requestJson('/test', {}, async () => Response.json({ status: 'failed' })), /失败/)
  await assert.rejects(requestJson('/test', {}, async () => new Response('upstream error', { status: 503 })), /503/)
})

test('filtered questions keep reserved characters in form fields', async () => {
  let received
  const result = await askFiltered('退货 & 换货?', 'return-policy', 'session-1', undefined, async (url, options) => {
    received = { url, method: options.method, body: Object.fromEntries(new URLSearchParams(options.body)) }
    return Response.json({ answer: '可以申请退货' })
  })
  assert.deepEqual(received, { url: '/api/chat/filter', method: 'POST', body: { question: '退货 & 换货?', docType: 'return-policy', sessionId: 'session-1' } })
  assert.equal(result.answer, '可以申请退货')
})
