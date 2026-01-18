/**
 * @fileoverview Web 端应用主组件
 * @description Web 版本的主应用组件，包含头部、编辑器和页脚
 * @module packages/web/App
 * @author MindFlow Team
 * @license MIT
 */

import React, { useState } from 'react';
import { Editor } from './components';

/**
 * Web 端应用主组件
 * @description 展示应用的基本布局，包括头部、编辑器和页脚
 * @returns JSX 元素
 */
function App(): JSX.Element {
  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState('');

  // 当前主题状态
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  /**
   * 处理编辑器内容变化
   * @param value - 新的编辑器内容
   */
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
  };

  /**
   * 处理主题变化
   * @param theme - 新主题
   */
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
  };

  return (
    <div className="container">
      {/* 头部区域：显示应用名称和版本标识 */}
      <header className="header">
        <h1>MindFlow</h1>
        <p>Web Version - Minimalist Markdown Editor</p>
      </header>

      {/* 主体区域：编辑器 */}
      <main className="main">
        <Editor
          theme={currentTheme}
          onChange={handleEditorChange}
          onThemeChange={handleThemeChange}
        />
      </main>

      {/* 页脚区域：版权信息 */}
      <footer className="footer">
        <p>&copy; 2025 MindFlow. A minimalist Markdown editor.</p>
        <p className="footer-info">
          {editorContent.length} characters
        </p>
      </footer>
    </div>
  );
}

export default App;
