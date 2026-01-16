/**
 * @fileoverview Web 端应用主组件
 * @description Web 版本的主应用组件，包含头部、编辑器占位符和页脚
 * @module packages/web/App
 * @author MindFlow Team
 * @license MIT
 */

import React from 'react';

/**
 * Web 端应用主组件
 * @description 展示应用的基本布局，包括头部、主体编辑器区域和页脚
 * @returns JSX 元素
 */
function App(): JSX.Element {
  return (
    <div className="container">
      {/* 头部区域：显示应用名称和版本标识 */}
      <header className="header">
        <h1>MindFlow</h1>
        <p>Web Version</p>
      </header>

      {/* 主体区域：编辑器占位符 */}
      <main className="main">
        <div className="editor-placeholder">
          <h2>Markdown Editor</h2>
          <p>Coming soon...</p>
        </div>
      </main>

      {/* 页脚区域：版权信息 */}
      <footer className="footer">
        <p>&copy; 2025 MindFlow. A minimalist Markdown editor.</p>
      </footer>
    </div>
  );
}

export default App;
