# 智能客服前端设计与实施

用户已确认：Vue 独立前端，暖白与深绿配色，只展示业务功能。

目标项目：E:/Java/idea_project/git_clone_project/rag-projec/spring-al-alibaba-customer。
新增 frontend 目录，保留现有后端及配置修改。临时构建在当前可写工作区完成，验证后复制新增目录至目标项目。

## 实施顺序

1. API 层：先测试 SSE 分块、中文、空格、正常结束不重连、错误响应与过滤参数，再实现请求封装。使用 fetch 读取流并支持取消；类型过滤使用同步接口。
2. Vue 页面：App 管理三个业务视图，ChatView 管理浏览器会话记录，KnowledgeView 管理查询和导入同步，DownloadsView 管理文件生成下载。聊天记录仅保存在当前浏览器。
3. CSS：桌面侧边栏与移动导航，暖白深绿，键盘焦点、减少动效支持，真实加载/错误/空状态。业务页面不展示技术介绍。
4. 验证：Node 接口测试、生产构建、浏览器桌面与移动检查；只对现有后端执行只读检查，不自动初始化或调用计费问答。

## 接口约束

- `/api/chat/stream` GET，question/sessionId 查询参数；SSE 正常 EOF 表示完成，不自动重试。
- `/api/chat/filter` POST 表单，question/docType/sessionId；非空 docType 分支不使用会话记忆。
- `/api/docs/search` GET，query/topK/docType，数组元素包含 id/content/metadata。
- `/api/docs/stats` GET，仅显示 knowledgeBaseFiles，不能当作已索引文档数。
- `/api/docs/import` POST 表单 filePath，只支持后端 TextReader 可读的文本文件路径，不做浏览器上传。
- `/api/docs/init`、`/sync`、`/generate-all` POST，HTTP 200 仍需检查业务 status。
- `/api/docs/download/order-manual`、`/return-manual` GET，Blob 下载并校验 HTTP 状态。
- `/api/search/test` 为检索测试用途，本次面向业务页面不放调试模式和已废弃添加接口。
