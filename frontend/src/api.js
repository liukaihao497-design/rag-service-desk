export const docTypes = [
  ['', '全部知识'], ['faq', '常见问题'], ['return-policy', '退货政策'],
  ['product-manual', '产品说明'], ['order-guide', '订单指南'], ['general', '其他资料'],
]

export async function requestJson(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, options)
  if (!response.ok) throw new Error(`请求失败（${response.status}），请稍后重试。`)
  const data = await response.json()
  if (['failed', 'error'].includes(data.status)) throw new Error(data.message || '操作失败，请检查输入后重试。')
  return data
}

export function askFiltered(question, docType, sessionId, signal, fetcher = fetch) {
  return requestJson('/api/chat/filter', {
    method: 'POST', body: new URLSearchParams({ question, docType, sessionId }), signal,
  }, fetcher)
}

// Keep UTF-8 and SSE framing intact even when transport chunks split a character or CRLF.
export async function readSse(body, onText) {
  if (!body) throw new Error('未收到回答，请重新发送。')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', lines = []
  const flush = () => {
    if (lines.length) onText(lines.join('\n'))
    lines = []
  }
  const line = value => {
    if (!value) flush()
    else if (value === 'data') lines.push('')
    else if (value.startsWith('data:')) lines.push(value.slice(5).replace(/^ /, ''))
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      let end
      while ((end = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, end).replace(/\r$/, ''))
        buffer = buffer.slice(end + 1)
      }
      if (done) { if (buffer) line(buffer.replace(/\r$/, '')); flush(); break }
    }
  } finally { reader.releaseLock() }
}

export async function streamAnswer(question, sessionId, signal, onText) {
  const response = await fetch(`/api/chat/stream?${new URLSearchParams({ question, sessionId })}`, { signal })
  if (!response.ok) throw new Error(`回答暂时不可用（${response.status}），请稍后重试。`)
  if (!response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('回答格式异常，请检查服务连接。')
  await readSse(response.body, onText)
}

export async function downloadManual(kind) {
  const response = await fetch(`/api/docs/download/${kind}-manual`)
  if (!response.ok) throw new Error(`下载失败（${response.status}），请稍后重试。`)
  const blob = await response.blob()
  if (!blob.size) throw new Error('文件内容为空，请重试。')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = kind === 'order' ? '订单说明书.docx' : '退货说明书.pdf'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
