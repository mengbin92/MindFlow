# MindFlow 测试框架搭建与功能优化实录

> **日期**: 2026-01-29
> **版本**: v0.1.0
> **测试环境**: Vitest + @testing-library/react + jsdom

---

## 引言

作为开源 Markdown 编辑器 MindFlow 的开发者，我们一直追求代码质量和用户体验的双重提升。今天在完成功能测试和框架搭建的过程中，从测试框架配置到用户交互细节优化，经历了一次完整的工程实践。本文记录了这次工作中遇到的关键问题、解决方案以及技术思考。

---

## 工作背景

### 任务目标

**Phase 测试与优化**：为 MindFlow 建立完整的测试体系，并优化文件管理功能。

**具体目标**：
- ✅ 配置 Vitest 测试框架
- ✅ 编写核心功能单元测试（@mindflow/core）
- ✅ 编写 Web 端集成测试（@mindflow/web）
- ✅ 修复构建错误和 TypeScript 类型问题
- ✅ 优化文件树新建文件的用户体验

---

## 第一部分：测试框架搭建

## 问题 #1: 测试框架选型与配置

### 🔍 问题背景

项目初期没有配置测试框架，随着功能增加，需要建立自动化测试体系来保证代码质量。

### 💡 解决方案

**选择 Vitest 作为测试框架**：

Vitest 是现代的前端测试框架，与 Vite 完美配合，支持 TypeScript 和 ESM。

**安装依赖**：

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**配置 vitest.config.ts（core 包）**：

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**配置 vitest.config.ts（web 包）**：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

**测试 setup 文件**：

```typescript
// packages/web/src/test/setup.ts
import '@testing-library/jest-dom';
```

### 📚 经验总结

- **框架选择**：Vitest 与 Vite 项目天然契合，启动速度快
- **环境配置**：jsdom 模拟浏览器环境，适合 React 组件测试
- **TypeScript 支持**：需要配置 @typescript-eslint 插件

---

## 问题 #2: 核心包单元测试编写

### 🔍 测试目标

为 @mindflow/core 包的核心功能编写单元测试。

### 💡 测试实现

**Parser 测试**（12 个测试用例）：

```typescript
import { describe, it, expect } from 'vitest';
import { parser } from '../parser';

describe('Parser', () => {
  it('should parse headings', () => {
    const markdown = '# Heading 1\n## Heading 2';
    const html = parser.parse(markdown);
    expect(html).toContain('<h1>Heading 1</h1>');
    expect(html).toContain('<h2>Heading 2</h2>');
  });

  it('should parse bold and italic', () => {
    const markdown = '**bold** *italic*';
    const html = parser.parse(markdown);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  // ... 更多测试用例
});
```

**ThemeManager 测试**（5 个测试用例）：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ThemeManager } from '../themes';

describe('ThemeManager', () => {
  it('should create with default light theme', () => {
    const manager = new ThemeManager();
    expect(manager.getTheme()).toBe('light');
  });

  it('should notify listeners when theme changes', () => {
    const manager = new ThemeManager();
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.setTheme('dark');
    expect(listener).toHaveBeenCalledWith('dark');
  });
});
```

**ShortcutManager 测试**（8 个测试用例）：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ShortcutManager } from '../shortcuts';

describe('ShortcutManager', () => {
  it('should register a shortcut', () => {
    const manager = new ShortcutManager();
    manager.register({
      key: 'Ctrl-B',
      description: 'Bold',
      handler: vi.fn(() => true),
    });
    expect(manager.getAll()).toHaveLength(1);
  });

  it('should throw when registering duplicate', () => {
    const manager = new ShortcutManager();
    manager.register({ key: 'Ctrl-B', description: 'Bold', handler: vi.fn() });
    expect(() => {
      manager.register({ key: 'Ctrl-B', description: 'Bold 2', handler: vi.fn() });
    }).toThrow();
  });
});
```

### 📚 经验总结

- **测试命名**：清晰描述测试行为，如 "should parse headings"
- **Mock 使用**：使用 vi.fn() 模拟函数调用
- **覆盖率**：关注核心逻辑的分支覆盖

---

## 问题 #3: Web 包集成测试编写

### 🔍 测试目标

测试 Redux store 和 React 组件的集成。

### 💡 测试实现

**Redux Store 测试**（11 个测试用例）：

```typescript
import { describe, it, expect } from 'vitest';
import fileSystemReducer, {
  setCurrentDirectory,
  openFile,
  closeFile,
} from '../fileSystemSlice';

describe('fileSystemSlice', () => {
  it('should add file to open files list', () => {
    const mockFile = createMockFile('/test.md', 'test.md');
    const state = fileSystemReducer(initialState, openFile(mockFile));
    expect(state.openFiles).toHaveLength(1);
    expect(state.currentFile).toEqual(mockFile);
  });

  it('should not add duplicate files', () => {
    const mockFile = createMockFile('/test.md', 'test.md');
    const state1 = fileSystemReducer(initialState, openFile(mockFile));
    const state2 = fileSystemReducer(state1, openFile(mockFile));
    expect(state2.openFiles).toHaveLength(1);
  });
});
```

**组件测试**（FileTree + SearchBar）：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { FileTree } from '../FileTree';

describe('FileTree Component', () => {
  it('should render toolbar buttons', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );
    expect(screen.getByText('📄 新建文件')).toBeInTheDocument();
    expect(screen.getByText('📁 新建文件夹')).toBeInTheDocument();
  });

  it('should open new file dialog when clicked', () => {
    const store = createStore();
    render(<Provider store={store}><FileTree /></Provider>);
    fireEvent.click(screen.getByText('📄 新建文件'));
    expect(screen.getByText('新建文件')).toBeInTheDocument();
  });
});
```

### 📚 经验总结

- **Redux 测试**：测试 reducer 纯函数，验证 state 变化
- **组件测试**：使用 @testing-library/react 进行用户视角的测试
- **Provider 包裹**：测试 Redux 组件需要提供 mock store

---

## 第二部分：构建问题修复

## 问题 #4: TypeScript 类型错误修复

### 🔍 问题现象

构建时出现多个 TypeScript 错误：

```
error TS2322: Type 'Date' is not assignable to type 'number'
error TS6133: 'vi' is declared but its value is never read
error TS2614: Module has no exported member 'FileSystemState'
```

### 🐛 根本原因

1. **Date 类型不匹配**：Redux state 中使用 `Date` 对象，但类型定义为 `number`
2. **未使用的导入**：测试文件中导入了 `vi` 但没有使用
3. **未导出的类型**：`FileSystemState` 接口没有导出

### 💡 解决方案

**修复 1：统一使用 timestamp**

```typescript
// 修改前
interface FileOperationState {
  lastOperation: Date | null;
}
state.operationState.lastOperation = new Date();

// 修改后
interface FileOperationState {
  lastOperation: number | null;
}
state.operationState.lastOperation = Date.now();
```

**修复 2：导出类型定义**

```typescript
// 修改前
interface FileSystemState { ... }

// 修改后
export interface FileSystemState { ... }
```

**修复 3：清理未使用的导入**

```typescript
// 修改前
import { describe, it, expect, vi } from 'vitest';

// 修改后（不需要 vi 时）
import { describe, it, expect } from 'vitest';
```

### 📚 经验总结

- **严格类型检查**：TypeScript 可以帮助发现潜在问题
- **Redux 可序列化**：State 必须是可序列化的，避免使用 Date、Map、Set
- **代码清理**：定期清理未使用的变量和导入

---

## 问题 #5: ESLint 配置完善

### 🔍 问题现象

运行 `npm run lint` 时出现错误：

```
Parsing error: Unexpected token
```

### 🐛 根本原因

ESLint 默认配置不支持 TypeScript。

### 💡 解决方案

**更新 .eslintrc.js**：

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
```

### 📚 经验总结

- **TypeScript ESLint**：需要 @typescript-eslint/parser 和 @typescript-eslint/plugin
- **规则配置**：根据项目需求调整规则严格程度
- **忽略模式**：使用 argsIgnorePattern: '^_' 允许下划线开头的未使用参数

---

## 第三部分：用户体验优化

## 问题 #6: 文件树新建文件体验优化

### 🔍 用户反馈

"新建文件时，如果想放在某个目录下，需要自己手动输入目录路径，不太方便。"

### 🐛 根本原因

新建文件对话框没有智能识别用户当前选中的文件夹，需要用户手动输入完整路径。

### 💡 解决方案

**智能路径选择功能**：

```typescript
// FileTree.tsx

// 获取当前选中的文件夹路径
const getSelectedFolderPath = (): string => {
  if (!selectedFile) return '';

  const node = findNodeByPath(fileTree, selectedFile);
  if (node?.isDir) {
    return selectedFile;  // 选中的是文件夹，直接使用
  }

  // 选中的是文件，返回其所在目录
  const lastSlashIndex = selectedFile.lastIndexOf('/');
  return lastSlashIndex > 0 ? selectedFile.substring(0, lastSlashIndex) : '';
};

// 根据路径查找节点
const findNodeByPath = (root: FileTreeNode | null, path: string): FileTreeNode | null => {
  if (!root) return null;
  if (root.path === path) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  return null;
};

// 处理新建文件
const handleNewFile = () => {
  const folderPath = getSelectedFolderPath();
  setNewItemPath(folderPath);  // 自动设置路径
  setNewItemName('');
  setShowNewFileDialog(true);
};
```

**UI 优化**：

```tsx
{/* 显示当前目标路径 */}
{newItemPath && (
  <div className="file-tree-dialog-path">
    📁 {newItemPath}/
  </div>
)}

{/* 简化的提示文字 */}
<div className="file-tree-dialog-hint">
  {newItemPath
    ? `文件将创建在 ${newItemPath}/ 目录下`
    : '文件将创建在根目录下'}
</div>
```

**样式优化**：

```css
.file-tree-dialog-path {
  margin-bottom: 12px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-secondary, #666);
  background-color: var(--bg-secondary, #f5f5f5);
  border-radius: 6px;
  border-left: 3px solid var(--accent-color, #213547);
  font-family: monospace;
}
```

### 📚 经验总结

- **智能默认值**：根据用户当前上下文提供智能默认选项
- **减少输入**：减少用户需要手动输入的内容
- **视觉反馈**：清晰显示当前操作的上下文（目标路径）

---

## 测试结果

### 测试统计

| 包 | 测试文件 | 测试数量 | 状态 |
|----|---------|---------|------|
| @mindflow/core | 3 | 25 | ✅ 通过 |
| @mindflow/web | 3 | 20 | ✅ 通过 |
| **总计** | **6** | **45** | **✅ 通过** |

### 构建验证

```bash
npm run build
# ✅ 所有包构建成功

npm run test
# ✅ 45 个测试全部通过

npm run lint
# ✅ 无错误，2 个警告
```

---

## 技术亮点

### 1. 测试架构设计

```
packages/
├── core/src/__tests__/
│   ├── parser.test.ts      (12 测试)
│   ├── themes.test.ts      (5 测试)
│   └── shortcuts.test.ts   (8 测试)
└── web/src/
    ├── store/__tests__/fileSystemSlice.test.ts  (11 测试)
    └── components/__tests__/
        ├── FileTree.test.tsx      (5 测试)
        └── SearchBar.test.tsx     (4 测试)
```

### 2. 用户体验优化模式

```
用户选中文件夹
    ↓
点击"新建文件"
    ↓
自动填充目标路径
    ↓
只需输入文件名
    ↓
文件自动创建在正确位置
```

### 3. 代码质量保障

- **TypeScript 严格模式**：类型安全检查
- **ESLint**：代码风格和潜在问题
- **单元测试**：核心功能覆盖
- **集成测试**：组件和状态管理

---

## 测试最佳实践

### 单元测试原则

```typescript
// ✅ 好的测试：描述性行为，单一职责
describe('Parser', () => {
  it('should parse headings', () => {
    const result = parser.parse('# Title');
    expect(result).toContain('<h1>Title</h1>');
  });
});

// ✅ 使用 Mock 隔离依赖
const listener = vi.fn();
manager.subscribe(listener);
expect(listener).toHaveBeenCalled();
```

### 组件测试原则

```typescript
// ✅ 从用户视角测试
it('should open new file dialog when clicked', () => {
  render(<FileTree />);
  fireEvent.click(screen.getByText('📄 新建文件'));
  expect(screen.getByText('新建文件')).toBeInTheDocument();
});
```

---

## 经验教训

### 1. 测试先行 vs 测试后补

**本次做法**：功能完成后补充测试
**问题**：发现了一些类型错误和未使用变量
**建议**：下次采用 TDD，写测试 → 实现 → 重构

### 2. 类型定义的重要性

**问题**：`FileSystemState` 未导出导致测试无法使用
**解决**：导出类型定义，统一类型管理
**建议**：公共类型必须导出，私有类型使用 `type`

### 3. 用户体验细节

**反馈**：用户指出新建文件需要手动输入路径
**改进**：自动识别选中文件夹，减少用户输入
**启发**：站在用户角度审视每一个交互细节

---

## 未来计划

### Phase 14: 测试增强

- [ ] 添加代码覆盖率报告（>80%）
- [ ] E2E 测试（Playwright）
- [ ] CI/CD 集成自动化测试
- [ ] 性能基准测试

### Phase 15: 功能完善

- [ ] 文件重命名功能
- [ ] 文件删除功能
- [ ] 拖拽排序文件
- [ ] 右键菜单操作

---

## 结语

本次工作完成了 MindFlow 的测试框架搭建和文件树体验优化。通过 45 个测试用例，为核心功能和 Web 端组件提供了质量保障。同时，根据用户反馈优化了新建文件的交互流程，让操作更加便捷。

**关键收获**：
1. **测试体系**：建立了完整的单元测试和集成测试架构
2. **代码质量**：通过 TypeScript 和 ESLint 提升代码健壮性
3. **用户体验**：从细节入手，减少用户操作步骤

**下一步行动**：
- ✅ 将测试集成到 CI/CD 流程
- ✅ 提升测试覆盖率到 80%+
- ✅ 持续收集用户反馈优化体验

---

**相关链接**：
- GitHub: https://github.com/your-org/mindflow
- 文档: https://mindflow.dev/docs
- 测试报告: TEST_REPORT.md

**作者**: MindFlow Team
**日期**: 2026-01-29
**标签**: #测试 #Vitest #React #TypeScript #用户体验
