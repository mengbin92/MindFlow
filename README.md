# MindFlow - 极简 Markdown 编辑器

<p align="center">
  <img src="assets/icon.svg" alt="MindFlow Logo" width="120">
</p>

<p align="center">
  一款极简风格的开源 Markdown 编辑器，致力于提供流畅的写作体验
</p>

<p align="center">
  <a href="https://github.com/yourusername/mindflow/releases">
    <img src="https://img.shields.io/github/v/release/yourusername/mindflow?style=flat-square" alt="Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/yourusername/mindflow?style=flat-square" alt="License">
  </a>
  <a href="https://md.mengbin.top">
    <img src="https://img.shields.io/badge/Web-在线体验-blue?style=flat-square" alt="Web">
  </a>
</p>

<p align="center">
  <a href="https://md.mengbin.top">在线体验</a> •
  <a href="#安装">下载安装</a> •
  <a href="docs/用户文档.md">使用文档</a> •
  <a href="docs/项目概览.md">开发文档</a> •
  <a href="CHANGELOG.md">更新日志</a>
</p>

---

## 功能特性

### 核心功能

- **极简设计** - 类似 Typora 的简洁界面，三栏布局（文件夹 + 文件列表 + 编辑器）
- **纯本地使用** - 无需联网，数据完全本地存储，全方位保障隐私
- **高性能** - 轻量架构，针对多文件和大文件场景优化，启动迅速，响应流畅
- **所见即所得** - 实时预览，支持语法高亮、自动排版

### 扩展支持

- **LaTeX 公式** - 基于 KaTeX，支持行内公式 `$...$` 和块级公式 `$$...$$`
- **Mermaid 图表** - 支持流程图、时序图、类图、甘特图等多种图表
- **PlantUML** - 专业 UML 图表支持
- **Markmap 思维导图** - 将 Markdown 转为交互式思维导图

### 导出与演示

- **多格式导出** - 支持 HTML、PDF、PNG、JPEG 导出
- **演示模式** - 基于 reveal.js 的 PPT 模式，支持演讲和分享

### 主题与配置

- **深色/浅色主题** - 一键切换，自动适配系统主题
- **FiraCode 字体** - 中文默认使用 FiraCode，等宽显示更舒适
- **自定义配置** - 丰富的配置项，支持导入/导出

## 安装

### 桌面端

| 平台 | 下载链接 | 系统要求 |
|------|----------|----------|
| macOS | [mindflow-macos.dmg](https://github.com/yourusername/mindflow/releases/latest) | macOS 10.15+ |
| Windows | [mindflow-windows.exe](https://github.com/yourusername/mindflow/releases/latest) | Windows 10+ |
| Linux | [mindflow-linux.AppImage](https://github.com/yourusername/mindflow/releases/latest) | Ubuntu 20.04+ |

### Web 端

直接访问 [https://md.mengbin.top](https://md.mengbin.top) 即可使用。

### 移动端

| 平台 | 下载链接 |
|------|----------|
| iOS | [App Store](https://apps.apple.com) |
| Android | [Google Play](https://play.google.com) / [APK](https://github.com/yourusername/mindflow/releases/latest) |

## 快速开始

### 基础使用

1. **打开文件夹** - 使用 `Cmd/Ctrl + O` 打开本地文件夹
2. **创建文件** - 点击侧边栏的 "+" 按钮或按 `Cmd/Ctrl + N`
3. **编辑内容** - 在编辑器中输入 Markdown 内容，右侧实时预览
4. **保存文件** - 按 `Cmd/Ctrl + S` 保存

### 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + N` | 新建文件 |
| `Cmd/Ctrl + O` | 打开文件夹 |
| `Cmd/Ctrl + S` | 保存文件 |
| `Cmd/Ctrl + Shift + E` | 导出文件 |
| `Cmd/Ctrl + Shift + P` | 演示模式 |
| `Cmd/Ctrl + Shift + M` | 切换预览模式 |
| `Cmd/Ctrl + B` | 切换侧边栏 |
| `Cmd/Ctrl + Shift + F` | 搜索文件 |

更多快捷键请参考 [用户文档](docs/用户文档.md)。

## 截图预览

<p align="center">
  <img src="docs/images/screenshot-editor.png" alt="编辑器界面" width="80%">
</p>

<p align="center">
  <img src="docs/images/screenshot-mermaid.png" alt="Mermaid 图表" width="80%">
</p>

## 开发

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Rust >= 1.70.0 (桌面端开发)

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 启动桌面端开发服务器
npm run desktop:dev

# 启动 Web 端开发服务器
npm run web:dev

# 构建所有包
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 项目结构

```
MindFlow/
├── packages/
│   ├── desktop/          # Tauri 桌面端
│   ├── web/              # Web 端
│   ├── mobile/           # Flutter 移动端
│   └── shared/           # 共享代码
├── docs/                 # 文档
├── scripts/              # 脚本工具
└── .github/workflows/    # CI/CD 配置
```

详细开发文档请参考 [项目概览](docs/项目概览.md)。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面端**: Tauri v2 + Rust
- **Web 端**: Vite + React
- **移动端**: Flutter
- **编辑器**: CodeMirror 6
- **状态管理**: Redux Toolkit
- **构建工具**: Turbo (Monorepo)

## 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

请参考 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

## 许可证

[MIT License](LICENSE) © 2026 孟斯特

## 致谢

感谢以下开源项目的支持：

- [CodeMirror 6](https://codemirror.net/) - 编辑器核心
- [Tauri](https://tauri.app/) - 桌面端框架
- [React](https://react.dev/) - UI 框架
- [reveal.js](https://revealjs.com/) - 演示模式
- [KaTeX](https://katex.org/) - LaTeX 渲染
- [Mermaid](https://mermaid.js.org/) - 图表渲染

---

<p align="center">
  Made with ❤️ by 孟斯特
</p>
