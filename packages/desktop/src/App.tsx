/**
 * @fileoverview 桌面端应用主组件
 * @description MindFlow 桌面端的主应用组件
 * @module packages/desktop/App
 * @author MindFlow Team
 * @license MIT
 */

import React from 'react';

/**
 * 桌面端应用主组件
 * @description 展示应用标题和基本信息的欢迎页面
 * @returns JSX 元素
 */
function App(): JSX.Element {
  return (
    <div className="container">
      <h1>MindFlow</h1>
      <p>A minimalist Markdown editor</p>
      <p>Desktop app powered by Tauri</p>
    </div>
  );
}

export default App;
