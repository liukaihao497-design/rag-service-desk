<script setup>
import { ref } from 'vue'
import Icon from './components/Icon.vue'
import ChatView from './views/ChatView.vue'
import KnowledgeView from './views/KnowledgeView.vue'
import DownloadsView from './views/DownloadsView.vue'

const active = ref('chat')
const nav = [{ id: 'chat', label: '智能客服', icon: 'chat' }, { id: 'knowledge', label: '知识库', icon: 'book' }, { id: 'downloads', label: '资料下载', icon: 'download' }]
const chat = ref(null)
function newChat() { active.value = 'chat'; chat.value?.newSession() }
</script>
<template>
  <div class="workspace">
    <aside class="sidebar">
      <a class="brand" href="#" @click.prevent="active = 'chat'" aria-label="知应，返回智能客服"><span class="brand-mark"><Icon name="leaf" :size="25" /></span><span>知应<span class="brand-sub">客户服务工作台</span></span></a>
      <button class="new-chat" @click="newChat"><Icon name="plus" :size="18" />发起新对话<kbd>＋</kbd></button>
      <div class="nav-caption">工作空间</div>
      <nav aria-label="主导航"><button v-for="item in nav" :key="item.id" :class="['nav-item', { active: active === item.id }]" :aria-current="active === item.id ? 'page' : undefined" @click="active = item.id"><Icon :name="item.icon" />{{ item.label }}<span v-if="active === item.id" class="nav-dot"></span></button></nav>
      <div class="sidebar-bottom"><span class="mini-mark"><Icon name="leaf" :size="17" /></span><span>每一个问题，都值得回应。<small>知应 · 智能客服</small></span></div>
    </aside>
    <main class="main-panel">
      <header class="topbar"><div class="breadcrumb">工作空间<span>/</span><strong>{{ nav.find(item => item.id === active).label }}</strong></div><span class="topbar-note">倾听问题，找到答案</span></header>
      <ChatView ref="chat" v-show="active === 'chat'" />
      <KnowledgeView v-if="active === 'knowledge'" />
      <DownloadsView v-if="active === 'downloads'" />
    </main>
  </div>
</template>
