# 贡献指南

感谢你对 MindFlow 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 报告 Bug
- 提交功能建议
- 改进文档
- 提交代码修复或新功能
- 分享使用经验

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)
- [分支策略](#分支策略)
- [Pull Request 流程](#pull-request-流程)
- [发布流程](#发布流程)

---

## 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺：

- 尊重不同的观点和经验
- 接受建设性的批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用带有性暗示的语言或图像
- 恶意挑衅、侮辱或贬低性评论
- 公开或私下骚扰
- 未经明确许可发布他人私人信息
- 其他不道德或不专业的行为

---

## 如何贡献

### 报告 Bug

在报告 Bug 之前，请先搜索 [Issues](https://github.com/yourusername/mindflow/issues) 确认该问题是否已被报告。

如果你找不到相关问题，请使用 [Bug 报告模板](.github/ISSUE_TEMPLATE/bug_report.md) 创建新 Issue，并包含以下信息：

- **问题描述** - 清晰简洁的问题描述
- **复现步骤** - 详细的复现步骤
- **期望行为** - 你期望发生的行为
- **实际行为** - 实际发生的行为
- **环境信息** - 操作系统、版本号等
- **截图** - 如果有的话，添加截图帮助解释问题

### 提交功能建议

如果你有好主意让 MindFlow 变得更好，欢迎提交功能建议。

请使用 [功能建议模板](.github/ISSUE_TEMPLATE/feature_request.md) 创建新 Issue，并包含：

- **功能描述** - 清晰简洁的功能描述
- **使用场景** - 描述这个功能会在什么场景下使用
- **预期行为** - 描述你期望这个功能如何工作
- **替代方案** - 描述你考虑过的替代解决方案
- **其他信息** - 任何其他相关的上下文或截图

### 改进文档

文档是项目的重要组成部分。如果你发现文档有：

- 拼写或语法错误
- 过时的信息
- 不清楚的表述
- 缺失的内容

欢迎提交 PR 修复或改进！

---

## 开发环境设置

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Rust** >= 1.70.0 (桌面端开发)
- **Git**

### 克隆仓库

```bash
git clone https://github.com/yourusername/mindflow.git
cd mindflow
```

### 安装依赖

```bash
npm install
```

或使用设置脚本：

```bash
./scripts/setup.sh
```

### 启动开发服务器

```bash
# 桌面端
npm run desktop:dev

# Web 端
npm run web:dev

# 移动端
npm run mobile:dev
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行 E2E 测试
npm run test:e2e
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 运行 Prettier 格式化
npm run format
```

---

## 代码规范

### TypeScript 规范

- 所有代码必须使用 TypeScript
- 启用严格模式 (`strict: true`)
- 避免使用 `any` 类型
- 使用显式返回类型声明函数

```typescript
// 好的示例
function calculateSum(a: number, b: number): number {
  return a + b;
}

// 不好的示例
function calculateSum(a, b) {
  return a + b;
}
```

### React 规范

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Props 接口使用 `Props` 后缀

```typescript
// 好的示例
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### CSS/样式规范

- 使用 CSS Modules 或 Tailwind CSS
- 类名使用 kebab-case
- 避免使用内联样式

### 文件命名

- 组件文件使用 PascalCase: `Button.tsx`
- 工具函数文件使用 camelCase: `formatDate.ts`
- 样式文件使用 kebab-case: `button.module.css`

### 导入顺序

```typescript
// 1. 外部库
import React from 'react';

// 2. 内部绝对导入
import { Button } from '@/components/Button';

// 3. 内部相对导入
import { useAuth } from '../hooks/useAuth';

// 4. 样式导入
import styles from './Header.module.css';
```

---

## 提交信息规范

本项目遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (Type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响代码运行的变动）|
| `refactor` | 代码重构（既不是新增功能，也不是修改 bug）|
| `perf` | 性能优化 |
| `test` | 添加测试 |
| `chore` | 构建过程或辅助工具的变动 |
| `ci` | CI 配置变动 |
| `build` | 构建系统或外部依赖变动 |

### 范围 (Scope)

范围指定提交影响的范围，可选：

- `editor` - 编辑器相关
- `file` - 文件管理相关
- `ui` - UI 组件相关
- `export` - 导出功能相关
- `theme` - 主题相关
- `desktop` - 桌面端相关
- `web` - Web 端相关
- `mobile` - 移动端相关
- `deps` - 依赖相关

### 主题 (Subject)

- 使用祈使语气，现在时态
- 首字母小写
- 不以句号结尾
- 不超过 50 个字符

### 示例

```bash
# 新功能
git commit -m "feat(editor): add markdown syntax highlighting"

# Bug 修复
git commit -m "fix(file): resolve file save issue on Windows"

# 文档更新
git commit -m "docs: update README with installation guide"

# 性能优化
git commit -m "perf(editor): optimize large file rendering"

# 代码重构
git commit -m "refactor(ui): simplify button component structure"
```

---

## 分支策略

### 分支类型

```
main
  │
  ├── develop
  │     │
  │     ├── feature/editor-enhancement
  │     ├── feature/new-export-format
  │     │
  │     ├── bugfix/file-save-error
  │     └── bugfix/memory-leak
  │
  └── hotfix/critical-security-fix
```

- **`main`**: 主分支，用于生产环境，始终保持稳定
- **`develop`**: 开发分支，用于日常开发
- **`feature/*`**: 功能分支，从 develop 创建
- **`bugfix/*`**: Bug 修复分支，从 develop 创建
- **`hotfix/*`**: 紧急修复分支，从 main 创建

### 命名规范

- 功能分支: `feature/short-description`
- Bug 修复: `bugfix/issue-number-short-description`
- 紧急修复: `hotfix/short-description`

### 示例

```bash
# 创建功能分支
git checkout -b feature/add-vim-mode develop

# 创建 Bug 修复分支
git checkout -b bugfix/123-file-save-error develop

# 创建紧急修复分支
git checkout -b hotfix/security-fix main
```

---

## Pull Request 流程

### 提交前检查清单

- [ ] 代码已通过 ESLint 检查 (`npm run lint`)
- [ ] 代码已格式化 (`npm run format`)
- [ ] 所有测试都已通过 (`npm run test`)
- [ ] 提交信息符合规范
- [ ] 文档已更新（如果需要）

### PR 流程

1. **Fork 仓库** - 点击 GitHub 上的 Fork 按钮

2. **创建分支** - 从 develop 分支创建功能分支

   ```bash
   git checkout -b feature/my-feature develop
   ```

3. **提交更改** - 按照提交信息规范提交代码

   ```bash
   git commit -m "feat: add my feature"
   ```

4. **推送分支** - 推送到你的 Fork 仓库

   ```bash
   git push origin feature/my-feature
   ```

5. **创建 PR** - 在 GitHub 上创建 Pull Request
   - 选择 `develop` 作为目标分支
   - 填写 PR 模板
   - 关联相关 Issue

6. **代码审查** - 等待维护者审查
   - 根据反馈修改代码
   - 保持沟通

7. **合并** - 审查通过后会被合并

### PR 模板

创建 PR 时请使用以下模板：

```markdown
## 描述
简短描述这个 PR 做了什么

## 相关 Issue
Fixes #123

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 文档已更新

## 截图（如果适用）
```

---

## 发布流程

### 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

### 发布步骤

1. 更新版本号
   ```bash
   npm version [patch|minor|major]
   ```

2. 更新 CHANGELOG.md

3. 创建发布 PR

4. 合并到 main 分支

5. 创建 GitHub Release

6. CI/CD 自动构建和发布

---

## 获取帮助

如果你在贡献过程中遇到任何问题，可以通过以下方式获取帮助：

- **GitHub Discussions**: 一般性讨论
- **GitHub Issues**: Bug 报告和功能建议
- **邮件**: dev@mindflow.app

---

再次感谢你的贡献！
