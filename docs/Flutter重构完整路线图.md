# MindFlow Flutter 重构完整路线图

> 本文档覆盖"最终收口"目标以及进入收口前必须补齐的前置缺口，形成从现状到 Phase 6 验收的完整路径。

## 1. 最终收口目标（Phase 6）

### 1.1 产品验收标准

| 验收项 | 指标 | 优先级 |
|--------|------|--------|
| 桌面端可打开本地文件夹并稳定编辑 Markdown | 功能闭环 | P0 |
| Web 端可完成基础写作链路 | 功能闭环 | P0 |
| Mobile 端可完成编辑、预览、收藏、导出分享 | 功能闭环 | P0 |
| 扩展语法和导出能力达到对外文档承诺 | 功能闭环 | P0 |
| 新 Flutter 工程成为默认交付入口 | 工程闭环 | P0 |

### 1.2 性能验收标准

| 验收项 | 指标 | 当前基线 | 目标值 |
|--------|------|----------|--------|
| 冷启动时间 | iOS Simulator | - | < 2s |
| 文件树响应 | 1000 节点 | - | < 500ms |
| 编辑延迟 | 5000 行文档 | - | < 100ms |
| 预览切换耗时 | - | - | < 300ms |
| 导出成功率 | HTML/PDF | - | > 95% |

### 1.3 工程验收标准

| 验收项 | 说明 |
|--------|------|
| Flutter monorepo 结构 | `apps/` + `packages/` + `melos.yaml` |
| 六端支持 | web / ios / android / macos / windows / linux |
| CI/CD 链路 | lint → test → build → release |
| 新 Flutter 工程替代旧 Web/Desktop 主入口 | 迁移完成 |

---

## 2. 前置缺口清单

### 2.1 Sprint 1 产出（已完成 ✅）

| 缺口项 | 当前状态 | 说明 |
|--------|----------|------|
| monorepo 目录结构 | ✅ 完成 | `apps/` + `packages/` |
| melos.yaml | ✅ 完成 | 多包管理配置 |
| 7 个 package 骨架 | ✅ 完成 | pubspec.yaml 已创建 |
| 代码迁移 | ⚠️ 部分 | models/domain/export/storage 已迁移，其他待验证 |
| 依赖安装 | ✅ 完成 | 130 依赖，web 版本冲突已修复 |

### 2.2 Sprint 2 前置缺口（未完成 ❌）

| 缺口项 | 当前状态 | 说明 |
|--------|----------|------|
| drift 数据库集成 | ❌ 未开始 | 仍使用 sqflite |
| drift 代码生成 | ❌ 未开始 | build_runner 未运行 |
| 数据库迁移脚本 | ❌ 未开始 | sqflite → drift 数据迁移 |
| WorkspaceFileSystem 实现 | ⚠️ 桩代码 | `workspace_file_system_io.dart` 等仅有 stub |
| 平台适配层 | ❌ 未实现 | Desktop/Web/Mobile 各端未适配 |

### 2.3 Sprint 3 前置缺口（未完成 ❌）

| 缺口项 | 当前状态 | 说明 |
|--------|----------|------|
| EditorBridgeController 完整实现 | ⚠️ 部分 | 已有框架，方法未完整 |
| CodeMirror 6 集成 | ❌ 未开始 | 未集成 |
| Web 端桥接 | ❌ 未开始 | `dart:js_interop` 桥接未实现 |
| Native 端桥接 | ⚠️ 部分 | `webview_flutter` 容器已配置 |
| 内容同步延迟 | ❌ 未验证 | < 50ms 目标未验证 |

### 2.4 Sprint 4 前置缺口（未完成 ❌）

| 缺口项 | 当前状态 | 说明 |
|--------|----------|------|
| Markdown AST 解析 | ⚠️ 基础 | 已有 `flutter_markdown_plus` |
| HTML 生成器 | ❌ 未实现 | 完整 HTML 生成未完成 |
| LaTeX 渲染 | ❌ 未实现 | 公式渲染缺失 |
| Mermaid 渲染 | ❌ 未实现 | 图表渲染缺失 |
| PlantUML 渲染 | ❌ 未实现 | 图表渲染缺失 |
| Markmap 渲染 | ❌ 未实现 | 思维导图渲染缺失 |

### 2.5 Sprint 5 前置缺口（未完成 ❌）

| 缺口项 | 当前状态 | 说明 |
|--------|----------|------|
| ExportService 抽象 | ⚠️ 部分 | `export_file_writer.dart` 已有 |
| HTML 导出 | ⚠️ 部分 | 基础实现，不完整 |
| PDF 导出 | ⚠️ 部分 | `pdf` 库已引入，逻辑待实现 |
| 图片导出 | ❌ 未实现 | `archive` 库已引入 |
| PresentationService | ⚠️ 部分 | `presentation_service.dart` 已有框架 |
| reveal.js 集成 | ❌ 未实现 | 演示模式缺失 |

---

## 3. 完整执行路线图

### 3.1 Sprint 1：工程结构迁移（已完成 ✅）

**时间**: Week 1-2 (2026-04-24 ~ 2026-05-07)

**产出**:
- [x] `apps/mindflow_flutter/` 六端应用
- [x] 7 个 `packages/` 骨架
- [x] `melos.yaml` 配置
- [x] 依赖安装完成

**验收**: 2026-04-24 ✅

---

### 3.2 Sprint 2：存储层升级（进行中 🔜）

**时间**: Week 3-4 (2026-05-08 ~ 2026-05-21)

**目标**: drift 数据库 + 平台抽象

**任务拆解**:

| # | 任务 | 说明 | Owner |
|---|------|------|-------|
| 2.1 | drift 环境搭建 | 添加 drift + drift_dev 依赖，运行 build_runner | @P7 |
| 2.2 | Document 表实现 | id, uuid, title, content, workspaceId, timestamps | @P7 |
| 2.3 | Workspace 表实现 | id, name, path, lastOpened, settings | @P7 |
| 2.4 | Settings 表实现 | theme, language, autoSave, etc | @P7 |
| 2.5 | Repository 实现 | DocumentRepository, WorkspaceRepository | @P7 |
| 2.6 | WorkspaceFileSystem IO 实现 | Desktop/Mobile 文件系统 | @P7 |
| 2.7 | WorkspaceFileSystem Web 实现 | File System Access API | @P7 |
| 2.8 | 数据迁移脚本 | sqflite → drift 迁移脚本 | @P7 |
| 2.9 | 单元测试 | 存储层测试覆盖 | @P7 |

**验收标准**:
- [ ] drift 数据库可正常工作
- [ ] 文档 CRUD 测试通过
- [ ] WorkspaceFileSystem 各平台实现完成
- [ ] 数据迁移脚本可回滚

---

### 3.3 Sprint 3：编辑器桥接（待启动 ⏳）

**时间**: Week 5-6 (2026-05-22 ~ 2026-06-04)

**目标**: CodeMirror Bridge 完成态

**任务拆解**:

| # | 任务 | 说明 | Owner |
|---|------|------|-------|
| 3.1 | EditorBridgeController 完善 | addContent, getContent, cursor APIs | @P7 |
| 3.2 | CodeMirror 6 核心包 | 引入 @codemirror/* 包 | @P7 |
| 3.3 | Markdown 插件配置 | @codemirror/lang-markdown | @P7 |
| 3.4 | Web 端 JS 桥接 | dart:js_interop 实现 | @P7 |
| 3.5 | Native 端 WebView | webview_flutter 容器配置 | @P7 |
| 3.6 | 快捷键系统 | Ctrl+B, Ctrl+I, etc | @P7 |
| 3.7 | 性能优化 | 内容同步延迟 < 50ms | @P7 |
| 3.8 | 集成测试 | 编辑链路测试 | @P7 |

**验收标准**:
- [ ] 编辑器 Bridge 集成成功
- [ ] CodeMirror 在 Web 端正常工作
- [ ] 内容同步延迟 < 50ms
- [ ] Markdown 命令执行正常

---

### 3.4 Sprint 4：渲染层（待启动 ⏳）

**时间**: Week 7 (2026-06-05 ~ 2026-06-11)

**目标**: Markdown + 扩展语法渲染

**任务拆解**:

| # | 任务 | 说明 | Owner |
|---|------|------|-------|
| 4.1 | Markdown AST 解析 | 使用 `markdown` 包 | @P7 |
| 4.2 | HTML 生成器 | 完整 HTML 输出 | @P7 |
| 4.3 | LaTeX 渲染 | KaTeX 集成 | @P7 |
| 4.4 | Mermaid 渲染 | Mermaid.js WebView | @P7 |
| 4.5 | 代码高亮 | highlight.js 或 Prism | @P7 |
| 4.6 | Preview 编排 | 预览服务层 | @P7 |
| 4.7 | 集成测试 | 渲染测试 | @P7 |

**验收标准**:
- [ ] 标准 Markdown 渲染正确
- [ ] LaTeX 公式显示正常
- [ ] Mermaid 图表渲染正常
- [ ] 代码高亮正确

---

### 3.5 Sprint 5：导出与演示（待启动 ⏳）

**时间**: Week 8 (2026-06-12 ~ 2026-06-18)

**目标**: 导出 + 演示模式完成

**任务拆解**:

| # | 任务 | 说明 | Owner |
|---|------|------|-------|
| 5.1 | ExportService 完善 | HTML/PDF/图片导出 | @P7 |
| 5.2 | HTML 导出 | 完整样式内联 | @P7 |
| 5.3 | PDF 导出 | `pdf` + `printing` 库 | @P7 |
| 5.4 | 图片导出 | `archive` 截图导出 | @P7 |
| 5.5 | PresentationService | 演示模式服务 | @P7 |
| 5.6 | reveal.js 集成 | 演示 HTML 生成 | @P7 |
| 5.7 | 导出测试 | 成功率 > 95% | @P7 |

**验收标准**:
- [ ] HTML 导出包含完整样式
- [ ] PDF 导出可读性良好
- [ ] 演示模式可播放

---

### 3.6 Sprint 6：收尾与集成（待启动 ⏳）

**时间**: Week 9 (2026-06-19 ~ 2026-06-25)

**任务拆解**:

| # | 任务 | 说明 |
|---|------|------|
| 6.1 | 集成测试 | 全链路测试 |
| 6.2 | 性能优化 | 冷启动、文件树、编辑延迟 |
| 6.3 | CI/CD 配置 | GitHub Actions |
| 6.4 | 文档更新 | README、CHANGELOG |
| 6.5 | 清理旧代码 | 移除 `lib/` 中的迁移文件 |

**验收标准**:
- [ ] 全链路测试通过
- [ ] 性能指标达标
- [ ] CI/CD 链路正常

---

### 3.7 Phase 6：最终验收（待启动 ⏳）

**时间**: Week 10 (2026-06-26 ~ 2026-06-30)

**任务拆解**:

| # | 任务 | 说明 |
|---|------|------|
| 7.1 | 性能验收 | 冷启动 < 2s，文件树 < 500ms |
| 7.2 | 功能验收 | 所有 P0 功能闭环 |
| 7.3 | 发布准备 | 版本号更新，release notes |
| 7.4 | 旧端切换 | Web/Desktop 切换到维护模式 |

**验收标准**:
- [ ] 性能指标全部达标
- [ ] 功能验收通过
- [ ] Flutter 成为默认交付入口

---

## 4. 依赖关系图

```
Week 1-2: Sprint 1 ✅
                │
                ▼
Week 3-4: Sprint 2 🔜 ────┬──────────────────┐
                │         │                  │
                ▼         ▼                  ▼
Week 5-6: Sprint 3 ⏳  Sprint 4 ⏳        Sprint 5 ⏳
                │         │                  │
                └─────────┴────────┬─────────┘
                                   │
                          Week 9: Sprint 6 ⏳
                                   │
                          Week 10: Phase 6 ⏳
```

---

## 5. 风险矩阵

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| drift 迁移数据丢失 | 低 | 高 | 保留 sqflite 双写，验证后切换 |
| CodeMirror Bridge 性能问题 | 中 | 高 | 预研阶段验证，备选 flutter_markdown |
| 多包依赖冲突 | 中 | 中 | melos workspace 统一版本管理 |
| 移动端文件系统权限 | 高 | 高 | 沙盒工作区 + 导入导出模式 |
| P7 团队产能不足 | 中 | 高 | P9 自执行补位 |

---

## 6. Owner 矩阵

| Sprint | P9 (Tech Lead) | P7 (执行) |
|--------|----------------|-----------|
| Sprint 1 | ✅ 已完成 | 辅助 |
| Sprint 2 | 监控 | 待分配 |
| Sprint 3 | 监控 | 待分配 |
| Sprint 4 | 监控 | 待分配 |
| Sprint 5 | 监控 | 待分配 |
| Sprint 6 | 监控 | 待分配 |
| Phase 6 | 主责 | - |

---

## 7. 下一步行动

### 立即执行（本周）
1. **Sprint 2 启动**: drift 环境搭建 + Document 表实现
2. **P7 团队分配**: 2 个 P7 并行执行 Sprint 2 任务
3. **每日站会**: 检查 Sprint 2 进度

### 本周目标
- drift 数据库可正常工作
- DocumentRepository 实现完成
- WorkspaceFileSystem IO 实现完成

---

> **Owner**: @mengbin (P9 Tech Lead)
> **Created**: 2026-04-24
> **Last Updated**: 2026-04-24
> **Status**: Sprint 1 ✅ | Sprint 2 🔜 | Sprint 3-6 ⏳
