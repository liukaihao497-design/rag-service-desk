<script setup>
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import Icon from '../components/Icon.vue'
import { askFiltered, streamAnswer, docTypes } from '../api.js'

const storageKey = 'zhiying-conversations-v1'
const storageNotice = ref('')
function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(data) ? data.filter(s => typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.messages)).map(s => ({ ...s, messages: s.messages.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').map(m => ({ ...m, pending: false })) })) : []
  } catch { return [] }
}
const sessions = ref(restore())
const currentId = ref(sessions.value[0]?.id)
const current = computed(() => sessions.value.find(s => s.id === currentId.value))
const question = ref(''), docType = ref(''), busy = ref(false), historyOpen = ref(false), error = ref(''), copied = ref(-1)
const messageList = ref(null), input = ref(null)
let controller
function newSession() {
  if (busy.value) controller?.abort()
  const session = { id: crypto.randomUUID(), title: '新对话', messages: [] }
  const empty = sessions.value.find(s => s.messages.length === 0)
  if (empty) currentId.value = empty.id
  else { sessions.value.unshift(session); currentId.value = session.id }
  error.value = ''; question.value = ''; historyOpen.value = false
  nextTick(() => input.value?.focus())
}
if (!current.value) newSession()
defineExpose({ newSession })
watch(sessions, () => {
  if (busy.value) return
  try { localStorage.setItem(storageKey, JSON.stringify(sessions.value.slice(0, 40))) }
  catch { storageNotice.value = '浏览器存储空间不足，本次对话暂时无法保存。' }
}, { deep: true })
async function scrollDown() { await nextTick(); if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight }
async function send(text = question.value) {
  const value = text.trim()
  if (!value || busy.value) return
  const session = current.value
  if (!session.messages.length) session.title = value.slice(0, 24)
  session.messages.push({ role: 'user', text: value })
  const response = { role: 'assistant', text: '', pending: true }
  session.messages.push(response)
  const answer = session.messages[session.messages.length - 1]
  question.value = ''; error.value = ''; busy.value = true
  controller = new AbortController()
  await scrollDown()
  try {
    if (docType.value) {
      const data = await askFiltered(value, docType.value, session.id, controller.signal)
      answer.text = data.answer || ''
    } else {
      await streamAnswer(value, session.id, controller.signal, chunk => { answer.text += chunk; scrollDown() })
    }
    if (!answer.text.trim()) throw new Error('暂时没有收到回答，请重新提问。')
  } catch (err) {
    if (err.name === 'AbortError') answer.note = '已停止回答'
    else { answer.note = '回答未完成'; error.value = err instanceof TypeError ? '无法连接服务，请检查后端是否已启动。' : err.message }
  } finally {
    busy.value = false; answer.pending = false
    await scrollDown()
  }
}
function selectSession(id) { if (busy.value) controller?.abort(); currentId.value = id; historyOpen.value = false; error.value = ''; scrollDown() }
async function copy(text, index) {
  try { await navigator.clipboard.writeText(text); copied.value = index; setTimeout(() => copied.value = -1, 1600) }
  catch { error.value = '复制失败，请手动选择回答内容。' }
}
function onKey(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send() } }
onBeforeUnmount(() => controller?.abort())
const starters = [
  { icon: 'file', title: '查询订单', text: '如何查询我的订单状态？', label: '了解订单与配送进度' },
  { icon: 'sync', title: '退换货帮助', text: '申请退货需要满足哪些条件？', label: '查看退货条件与办理流程' },
  { icon: 'book', title: '了解产品', text: '产品有哪些主要功能？', label: '查阅产品说明与常见问题' },
]
</script>
<template>
  <section class="chat-page">
    <div class="page-heading chat-heading"><div><div class="eyebrow">随时为你解答</div><h1>智能客服<span class="heading-dot">·</span><span class="heading-light">让问题有答案</span></h1></div><button class="button subtle" @click="historyOpen = !historyOpen"><Icon name="clock" :size="17" />历史对话</button></div>
    <div v-if="historyOpen" class="history-panel"><div class="history-heading"><strong>历史对话</strong><span>仅保存在当前浏览器</span><button class="icon-button" aria-label="关闭历史对话" @click="historyOpen = false"><Icon name="close" :size="17" /></button></div><button v-for="session in sessions" :key="session.id" :class="['history-item', { selected: session.id === currentId }]" @click="selectSession(session.id)"><Icon name="chat" :size="16" /><span>{{ session.title }}</span><Icon name="chevron" :size="14" /></button></div>
    <div ref="messageList" class="chat-body">
      <div v-if="!current.messages.length" class="welcome">
        <div class="welcome-emblem"><span class="emblem-orbit"></span><Icon name="leaf" :size="39" /><span class="emblem-spark">✦</span></div>
        <div class="welcome-kicker">你好，欢迎来到知应</div><h2>今天，有什么可以帮你？</h2><p>关于订单、退换货或产品使用，<br class="mobile-break" />把你的问题交给我。</p>
        <div class="starter-grid"><button v-for="item in starters" :key="item.title" class="starter-card" @click="send(item.text)"><span class="starter-icon"><Icon :name="item.icon" :size="22" /></span><strong>{{ item.title }}</strong><span>{{ item.label }}</span><Icon class="starter-arrow" name="chevron" :size="16" /></button></div>
        <div class="welcome-foot"><span></span>从一个问题，开始对话<span></span></div>
      </div>
      <div v-else class="messages" role="log" aria-label="对话内容" aria-live="polite" :aria-busy="busy">
        <article v-for="(message, index) in current.messages" :key="index" :class="['message', message.role]"><span class="avatar"><Icon v-if="message.role === 'assistant'" name="leaf" :size="20" /><template v-else>我</template></span><div class="message-content"><div class="message-author">{{ message.role === 'assistant' ? '知应' : '你' }}<span v-if="message.pending">正在回答</span></div><div v-if="message.text" class="message-text">{{ message.text }}</div><div v-else-if="message.pending" class="thinking"><span></span><span></span><span></span><small>正在整理答案…</small></div><small v-if="message.note" class="message-note">{{ message.note }}</small><button v-if="message.role === 'assistant' && message.text && !message.pending" class="copy-button" @click="copy(message.text, index)"><Icon :name="copied === index ? 'check' : 'copy'" :size="14" />{{ copied === index ? '已复制' : '复制回答' }}</button></div></article>
      </div>
    </div>
    <div class="composer-area">
      <div v-if="error || storageNotice" class="notice error" role="alert">{{ error || storageNotice }}<button v-if="error" class="text-button" @click="error = ''">关闭</button></div>
      <form class="composer" @submit.prevent="send()"><label class="sr-only" for="question">输入你的问题</label><textarea id="question" ref="input" v-model="question" rows="2" maxlength="4000" placeholder="输入你的问题，例如：我的订单什么时候发货？" @keydown="onKey"></textarea><div class="composer-tools"><label class="scope-select"><Icon name="book" :size="16" /><select v-model="docType" :disabled="busy" aria-label="问答知识范围"><option v-for="[value, label] in docTypes" :key="value" :value="value">{{ label }}</option></select></label><span class="enter-hint">Enter 发送 · Shift + Enter 换行</span><button v-if="busy" type="button" class="send-button stop" aria-label="停止回答" @click="controller?.abort()"><span></span></button><button v-else class="send-button" type="submit" :disabled="!question.trim()" aria-label="发送问题"><Icon name="arrow" :size="21" /></button></div></form>
      <p class="composer-note">{{ docType ? '当前仅在所选资料中回答，每次提问独立处理。' : '回答仅供参考，订单与售后信息请以实际业务记录为准。' }}</p>
    </div>
  </section>
</template>
