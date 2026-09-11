# RAG 智能客服工作台

基于 Spring AI Alibaba 的智能客服项目，将日常对话、知识库问答与业务数据查询接入统一聊天入口。后端根据问题意图选择处理流程，前端使用 Vue 提供客服交互页面。

## 核心功能

| 能力 | 实现方式 |
| --- | --- |
| 意图路由 | 将问题路由到普通对话、RAG 检索或数据库查询 |
| 文档检索 | 查询改写，结合向量检索与 BM25，通过 RRF 融合结果 |
| 结果处理 | 检索去重与重排序，包含重排序异常时的降级逻辑 |
| 工具调用 | 通过 `@Tool` 调用业务查询服务，支持受控的自然语言转 SQL |
| SQL 校验 | 使用 JSqlParser 解析 SQL，限制操作类型与可访问的表、列 |
| 对话记忆 | Redis 保存近期对话，结合结构化用户事实与异步持久化 |
| 文档管理 | 提供知识库初始化、导入、搜索及 Word / PDF 生成接口 |
| 流式响应 | 提供 SSE 对话接口 |

## 技术栈

Java 17、Spring Boot 3.5.4、Spring AI 1.1.2、Spring AI Alibaba 1.1.2.2、DashScope、PostgreSQL / pgvector、Redis、Spring Data JPA、JSqlParser、Apache Tika、Vue 3、Vite。

## 处理流程

```text
用户问题 → ChatController → ChatService → 意图识别
                                         ├─ 普通对话 → 模型生成
                                         ├─ 知识问答 → 查询改写 → 混合检索 → 去重 / 排序 → 模型生成
                                         └─ 数据查询 → 工具调用 → 查询服务 / SQL 校验
                回答返回 ← 对话记忆与上下文参与生成
```

## 源码阅读入口

后端源码位于 `src/main/java/com/example/smartcs`。

- [对话编排](src/main/java/com/example/smartcs/service/ChatService.java)：查看意图路由及各处理流程的衔接。
- [混合检索](src/main/java/com/example/smartcs/search)：查看 BM25、向量融合及重排序。
- [文档检索](src/main/java/com/example/smartcs/service/DocumentRetriever.java)：查看查询召回、去重与排序编排。
- [SQL 校验](src/main/java/com/example/smartcs/config/SqlSecurityValidator.java)：查看 SQL 解析与访问限制。
- [业务查询](src/main/java/com/example/smartcs/service/DatabaseQueryService.java)：查看工具调用对应的业务查询逻辑。
- [前端](frontend)：查看 Vue 工作台及启动说明。

## 本地运行

1. 准备 JDK 17、Maven、PostgreSQL / pgvector、Redis 和 DashScope API Key；前端需要与仓库 Vite 版本兼容的 Node.js。
2. 查看 [数据库脚本](src/main/resources/db/schema.sql) 和 `src/main/resources/application.yml`，配置本地数据库、缓存和模型连接。
3. 按配置提供 `PASSWORD`、`REDIS_PASSWORD`、`DASHSCOPE_API_KEY` 等环境变量。公开版本未提供可用的服务凭据。
4. 在项目根目录启动后端：

```bash
mvn spring-boot:run
```

后端默认端口为 `8080`。前端在独立终端启动：

```bash
cd frontend
npm install
npm run dev
```

前端访问地址及后端代理配置见 [前端说明](frontend/README.md)。

## 常用接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/chat` | 普通对话入口 |
| POST | `/api/chat/filter` | 带文档过滤的问答 |
| GET | `/api/chat/stream` | SSE 流式对话 |
| POST | `/api/docs/init` | 初始化知识库 |
| POST | `/api/docs/import` | 导入资料 |
| GET | `/api/docs/search` | 搜索资料 |

## 说明

当前仓库用于功能实践与代码展示，不附带生产吞吐、检索准确率或延迟承诺。模型调用依赖实际服务配置；SQL 规则校验需结合业务权限与数据库权限配置使用。

本仓库基于 `yuquanquan/spring-al-alibaba-customer` 项目进行学习实践，保留原有来源信息。本文描述当前仓库功能，不将上游实现表述为个人独立原创。
