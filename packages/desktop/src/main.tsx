/**
 * @fileoverview 桌面端应用入口
 * @description 使用 Tauri + React 创建桌面应用的入口文件
 * @module packages/desktop/main
 * @author MindFlow Team
 * @license MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * 渲染桌面端应用
 * @description 创建 React 根节点并渲染 App 组件
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
