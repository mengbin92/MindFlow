/**
 * @fileoverview Web 端应用入口
 * @description Web 版本应用的入口文件
 * @module packages/web/main
 * @author MindFlow Team
 * @license MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * 渲染 Web 端应用
 * @description 创建 React 根节点并渲染 App 组件
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
