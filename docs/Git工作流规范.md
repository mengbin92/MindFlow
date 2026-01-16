# Git 工作流规范

## 分支策略

### 主要分支

- `main`: 主分支，用于生产环境。始终保持稳定可发布状态。
- `develop`: 开发分支，用于集成最新的开发功能。

### 功能分支

- `feature/*`: 新功能开发
  - 从 `develop` 分支创建
  - 完成后合并回 `develop`
  - 命名示例: `feature/markdown-editor`, `theme/dark-mode`

- `bugfix/*`: Bug 修复
  - 从 `develop` 分支创建
  - 完成后合并回 `develop`
  - 命名示例: `bugfix/file-save-error`, `bugfix/preview-sync`

- `hotfix/*`: 生产环境紧急修复
  - 从 `main` 分支创建
  - 完成后同时合并到 `main` 和 `develop`
  - 命名示例: `hotfix/security-patch`

## 工作流程

### 功能开发流程

1. 从 `develop` 创建功能分支
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. 开发并提交代码
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. 推送到远程仓库
   ```bash
   git push origin feature/your-feature-name
   ```

4. 创建 Pull Request 到 `develop` 分支

5. 代码审查通过后合并

### 发布流程

1. 从 `develop` 创建 release 分支
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. 进行版本号更新和最后的测试

3. 合并到 `main` 并打标签
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   ```

4. 合并回 `develop`
   ```bash
   git checkout develop
   git merge release/v1.0.0
   git push origin develop
   ```

## 提交信息规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `ci`: CI 配置更新

### 示例

```bash
# 新功能
git commit -m "feat(editor): add markdown syntax highlighting"

# Bug 修复
git commit -m "fix(file): resolve file save issue on Windows"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 性能优化
git commit -m "perf(renderer): optimize large file rendering"
```

## 代码审查

### Pull Request 检查清单

- [ ] 代码符合项目规范
- [ ] 没有引入新的警告
- [ ] 测试已通过
- [ ] 文档已更新
- [ ] 提交信息清晰明确
- [ ] 没有引入不必要的依赖

### 审查流程

1. 自动化检查（CI/CD）
   - Lint 检查
   - 格式检查
   - 构建测试

2. 人工审查
   - 至少一人审查通过
   - 所有审查意见已处理
   - 无冲突可以合并

## 最佳实践

1. **频繁提交**: 小步快跑，频繁提交，便于代码审查和问题定位

2. **原子性提交**: 每次提交只做一件事，保持提交的原子性

3. **清晰的提交信息**: 提交信息应该清晰描述改动内容

4. **保持分支更新**: 定期从上游分支拉取最新代码，减少合并冲突

5. **删除已合并分支**: 定期清理已合并的功能分支，保持仓库整洁

6. **使用 .gitignore**: 确保敏感文件和构建产物不被提交

7. **代码审查前置**: 在提交 PR 前先自我审查

## 紧急情况处理

### Hotfix 流程

当生产环境出现紧急问题需要修复时：

1. 从 `main` 创建 hotfix 分支
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue
   ```

2. 修复并测试

3. 合并到 `main` 和 `develop`
   ```bash
   # 合并到 main
   git checkout main
   git merge hotfix/critical-issue
   git tag -a v1.0.1 -m "Hotfix version 1.0.1"

   # 合并到 develop
   git checkout develop
   git merge hotfix/critical-issue
   ```

4. 删除 hotfix 分支

## 版本号规范

遵循语义化版本 (Semantic Versioning):

- **MAJOR.MINOR.PATCH** (如 1.2.3)
  - MAJOR: 不兼容的 API 变更
  - MINOR: 向后兼容的功能新增
  - PATCH: 向后兼容的 Bug 修复

示例:
- 1.0.0 → 1.0.1: Bug 修复
- 1.0.1 → 1.1.0: 新增功能
- 1.1.0 → 2.0.0: 重大变更
