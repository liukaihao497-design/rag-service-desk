# 知应客服前端

## 运行

需要 Node.js 22.14 或更高版本。

```powershell
cd E:\Java\idea_project\git_clone_project\rag-projec\spring-al-alibaba-customer\frontend
npm ci
npm run dev
```

打开 http://localhost:5173。后端默认连接 http://127.0.0.1:8080。
若后端地址不同，将 `.env.example` 复制为 `.env.local`，修改 `API_TARGET` 后重启前端。

```powershell
npm test
npm run build
npm run preview
```

生产构建在 `dist/`。正式部署需将 `/api` 反向代理至后端；开发与本地预览已配置代理。

## 页面

- 智能客服：普通范围使用流式回答；选择资料类型时使用过滤问答接口。后端过滤问答不携带多轮记忆，页面会提示。
- 历史对话：保存在当前浏览器，刷新可恢复，最多保存最近 40 个会话。不是后端历史接口。
- 知识库：检索、源文件统计、初始化、同步、服务器文本文件路径导入。统计是配置的源文件数量，不是入库数量。
- 资料下载：订单说明书 DOCX、退货说明书 PDF，可一键生成。

不会自动初始化知识库、生成文件或发送示例问题。需要点击对应操作。
检索测试 Controller 的调试模式及已废弃接口不展示在业务页面。
字体加载失败时自动回退至本地中文字体。
