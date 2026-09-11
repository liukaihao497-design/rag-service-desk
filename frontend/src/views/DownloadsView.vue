<script setup>
import { ref } from 'vue'
import Icon from '../components/Icon.vue'
import { downloadManual, requestJson } from '../api.js'
const busy = ref(''), error = ref(''), notice = ref('')
const manuals = [
  { id: 'order', title: '订单说明书', format: 'DOCX', category: '订单服务', description: '查阅订单相关说明，方便随时参考与留存。', color: 'green', number: '01' },
  { id: 'return', title: '退货说明书', format: 'PDF', category: '售后服务', description: '了解退货办理说明，让售后处理更加清晰。', color: 'clay', number: '02' },
]
async function run(kind) {
  if (busy.value) return
  busy.value = kind; error.value = ''; notice.value = ''
  try {
    if (kind === 'all') { await requestJson('/api/docs/generate-all', { method: 'POST' }); notice.value = '全部资料已生成，可以分别下载。' }
    else { await downloadManual(kind); notice.value = '文件已准备好，请查看浏览器下载列表。' }
  } catch (err) { error.value = err instanceof TypeError ? '无法连接服务，请稍后重试。' : err.message }
  finally { busy.value = '' }
}
</script>
<template>
  <section class="content-page">
    <div class="page-heading"><div><div class="eyebrow">需要的时候，资料就在手边</div><h1>资料下载</h1><p class="page-description">获取订单与售后说明，便于查阅、分享和留存。</p></div><button class="button" :disabled="!!busy" @click="run('all')"><Icon name="sync" :size="17" />{{ busy === 'all' ? '正在生成…' : '一键生成资料' }}</button></div>
    <div v-if="error" class="notice error" role="alert">{{ error }}</div><div v-if="notice" class="notice success" role="status"><Icon name="check" :size="17" />{{ notice }}</div>
    <div class="manual-grid"><article v-for="manual in manuals" :key="manual.id" :class="['manual-card', manual.color]"><div class="manual-preview"><span class="manual-index">{{ manual.number }} / 资料中心</span><div class="paper"><span class="paper-brand"><Icon name="leaf" :size="16" />知应</span><span class="paper-category">{{ manual.category }}</span><strong>{{ manual.title }}</strong><div class="paper-line wide"></div><div class="paper-line"></div><div class="paper-line short"></div><div class="paper-box"><span></span><span></span><span></span></div><span class="paper-footer">客户服务 · 业务资料</span></div><span class="format-stamp">{{ manual.format }}</span></div><div class="manual-info"><span class="eyebrow">{{ manual.category }}</span><h2>{{ manual.title }}</h2><p>{{ manual.description }}</p><button class="button download-button" :disabled="!!busy" @click="run(manual.id)"><Icon name="download" :size="18" />{{ busy === manual.id ? '正在准备文件…' : '生成并下载' }}<span>{{ manual.format }}</span></button></div></article></div>
    <div class="download-note"><Icon name="file" :size="19" /><div><strong>随用随取，轻松留存</strong><p>点击下载后将生成说明书。文件准备需要一点时间，请勿重复点击。</p></div></div>
  </section>
</template>
