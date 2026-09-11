<script setup>
defineProps({ name: String, size: { type: [Number, String], default: 20 } })
const paths = {
  chat: 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2A8.5 8.5 0 0 1 21 11.5ZM7 10h9M7 14h6',
  book: 'M12 5v16M12 5C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 1Z',
  file: 'M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8M8 16h6',
  plus: 'M12 5v14M5 12h14', arrow: 'M12 19V5M6 11l6-6 6 6',
  chevron: 'm9 5 7 7-7 7', search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  sync: 'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  leaf: 'M20 3C9 1 2 6 5 14c2 6 13 7 15-11ZM4 21 15 9',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  copy: 'M8 8h13v13H8ZM16 8V3H3v13h5',
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.file" /></svg></template>
