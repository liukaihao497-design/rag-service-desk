<script setup>
import { ref, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { requestJson, docTypes } from '../api.js'

const query = ref(''), docType = ref(''), topK = ref(5), results = ref([]), searched = ref(false), searching = ref(false)
const stats = ref(null), statsError = ref(''), error = ref(''), notice = ref(''), operation = ref(''), filePath = ref(''), showImport = ref(false)
async function loadStats() {
  statsError.value = ''
  try { stats.value = await requestJson('/api/docs/stats') }
  catch { statsError.value = '资料统计暂时不可用'; stats.value = null }
}
onMounted(loadStats)
async function search() {
  if (!query.value.trim() || searching.value) return
  searching.value = true; error.value = ''; results.value = []; searched.value = false
  try {
    const params = new URLSearchParams({ query: query.value.trim(), topK: String(topK.value) })
    if (docType.value) params.set('docType', docType.value)
    const data = await requestJson(`/api/docs/search?${params}`)
    if (!Array.isArray(data)) throw new Error('未能读取检索结果，请重试。')
    results.value = data; searched.value = true
  } catch (err) { error.value = err instanceof TypeError ? '无法连接知识库，请检查服务后重试。' : err.message }
  finally { searching.value = false }
}
async function run(action) {
  if (operation.value) return
  if (action === 'import' && !filePath.value.trim()) return
  operation.value = action; error.value = ''; notice.value = ''
  try {
    const options = { method: 'POST' }
    if (action === 'import') options.body = new URLSearchParams({ filePath: filePath.value.trim() })
    const data = await requestJson(`/api/docs/${action}`, options)
    if (action === 'sync') {
      const s = data.stats || {}
      notice.value = `同步完成：新增 ${s.new ?? 0}，更新 ${s.modified ?? 0}，移除 ${s.deleted ?? 0}，未变化 ${s.unchanged ?? 0}。`
    } else if (action === 'import') { notice.value = `导入完成，共处理 ${data.documentChunks ?? 0} 个内容片段。`; filePath.value = ''; showImport.value = false }
    else notice.value = data.message || '知识库初始化完成。'
    await loadStats()
  } catch (err) { error.value = err instanceof TypeError ? '无法连接服务，请稍后重试。' : err.message }
  finally { operation.value = '' }
}
function title(item) { const m = item.metadata || {}; return m.docTitle || m.sectionTitle || String(m.source || '知识库资料').split(/[\\/]/).pop() }
function label(item) { return docTypes.find(([value]) => value === item.metadata?.docType)?.[1] || '其他资料' }
</script>
<template>
  <section class="content-page">
    <div class="page-heading"><div><div class="eyebrow">让每一份知识，都能被找到</div><h1>知识库</h1><p class="page-description">查阅业务资料，为每一个问题找到依据。</p></div><button class="button primary" @click="showImport = !showImport"><Icon name="plus" :size="17" />导入资料</button></div>
    <div class="knowledge-overview"><div class="overview-icon"><Icon name="book" :size="30" /></div><div><span class="eyebrow">知识库源文件</span><div class="stat-value">{{ stats?.knowledgeBaseFiles ?? '—' }}<small>份资料</small></div><span class="stat-caption">{{ statsError || '当前配置的知识库源文件' }}</span></div><div class="overview-actions"><button class="button" :disabled="!!operation" @click="run('init')">{{ operation === 'init' ? '正在初始化…' : '初始化知识库' }}</button><button class="button" :disabled="!!operation" @click="run('sync')"><Icon name="sync" :size="16" />{{ operation === 'sync' ? '正在同步…' : '同步资料' }}</button><button v-if="statsError" class="text-button" @click="loadStats">重试统计</button></div></div>
    <div v-if="error" class="notice error" role="alert">{{ error }}</div><div v-if="notice" class="notice success" role="status"><Icon name="check" :size="17" />{{ notice }}</div>
    <form v-if="showImport" class="import-panel" @submit.prevent="run('import')"><div class="section-heading"><h2>导入本地资料</h2><button class="icon-button" type="button" aria-label="关闭导入" @click="showImport = false"><Icon name="close" :size="18" /></button></div><label for="file-path">服务器文件路径</label><div class="input-row"><input id="file-path" v-model="filePath" placeholder="例如：E:\knowledge\售后说明.txt" required /><button class="button primary" :disabled="!!operation || !filePath.trim()">{{ operation === 'import' ? '正在导入…' : '确认导入' }}</button></div><p>请输入后端服务可访问的文本文件完整路径，支持 TXT、Markdown 等纯文本资料。</p></form>
    <div class="section-heading search-heading"><h2>搜索资料</h2><span>从问题出发，找到相关内容</span></div>
    <form class="search-form" @submit.prevent="search"><div class="search-input"><Icon name="search" :size="20" /><input v-model="query" aria-label="搜索关键词" placeholder="搜索退货政策、订单说明、产品使用…" required /></div><select v-model="docType" aria-label="资料类型"><option v-for="[value, label] in docTypes" :key="value" :value="value">{{ label }}</option></select><select v-model="topK" aria-label="结果数量"><option :value="5">5 条结果</option><option :value="10">10 条结果</option><option :value="20">20 条结果</option></select><button class="button primary" :disabled="searching || !query.trim()">{{ searching ? '搜索中…' : '搜索' }}</button></form>
    <div v-if="searching" class="empty-state" role="status"><span class="loading-ring"></span><h3>正在查找相关资料</h3><p>请稍候，搜索结果即将呈现。</p></div>
    <div v-else-if="results.length" class="search-results"><div class="results-count">找到 {{ results.length }} 条相关内容</div><article v-for="(item, index) in results" :key="item.id || index" class="result-card"><span class="result-number">{{ String(index + 1).padStart(2, '0') }}</span><div><div class="result-title"><h3>{{ title(item) }}</h3><span class="tag">{{ label(item) }}</span></div><p>{{ item.content }}</p><span v-if="item.metadata?.sectionTitle" class="result-section">{{ item.metadata.sectionTitle }}</span></div></article></div>
    <div v-else class="empty-state"><div class="empty-icon"><Icon :name="searched ? 'search' : 'book'" :size="32" /></div><h3>{{ searched ? '暂时没有找到相关资料' : '你的答案，或许就在这里' }}</h3><p>{{ searched ? '试试更简短的关键词，或切换资料类型后再搜索。' : '输入关键词，查找知识库中的业务说明与常见问题。' }}</p></div>
  </section>
</template>
