# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [2.0.0] - 2026-04-03

### 重构

- **Flutter 统一架构** - 将 Web/Desktop/Mobile 统一到 Flutter 单一代码库
- **BLoC 状态管理** - 使用 flutter_bloc 统一管理应用状态
- **drift 替换 sqflite** - 更可维护的本地数据库方案
- **平台适配层** - 抽象文件系统、导出、分享等平台差异

### 新增

- [渲染] PlantUML 图表支持（```plantuml / ```puml 语法）
- [渲染] Markmap 思维导图支持（```markmap 语法）
- [渲染] LaTeX 公式桥接（行内 $...$ 和块级 $$...$$）
- [渲染] Mermaid 图表桥接
- [演示] reveal.js 全屏演示模式，支持主题/过渡/演讲者备注
- [导出] HTML/PDF/PNG/JPEG/Markdown 导出
- [导出] 多页图片 ZIP 导出
- [平台] macOS 桌面端支持
- [平台] Android/iOS/Web/macOS 四端支持
- [工程] Flutter CI/CD (GitHub Actions)
- [工程] 集成测试基础设施
- [工程] 43 个单元测试全部通过

### 变更

- 应用主入口从 React/TS 切换到 Flutter/Dart
- 旧 Web (React+Vite) 和 Desktop (Tauri) 包进入维护模式
- 编辑器采用 Bridge 策略，通过 WebView 桥接 CodeMirror 6

## [1.0.0] - 2026-02-02

### 新增

- React + TypeScript Web 端完整实现
- Tauri v2 桌面端 (macOS/Windows/Linux)
- CodeMirror 6 编辑器集成
- LaTeX (KaTeX)、Mermaid、PlantUML、Markmap 扩展语法
- HTML/PDF/PNG/JPEG 导出
- reveal.js 演示模式
- 深色/浅色主题
- 文件树、文件列表、三栏布局
- Flutter Mobile 雏形

---

## 版本说明

### 版本号规则

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正
