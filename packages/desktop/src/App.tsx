/**
 * @fileoverview 桌面端应用主组件
 * @description MindFlow 桌面端的主应用组件，包含三栏布局和文件管理
 * @module packages/desktop/App
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { FileTree } from './components/FileTree';
import { FileList } from './components/FileList';
import { SearchBar } from './components/SearchBar';
import { store } from './store';
import './styles.css';

/**
 * 主应用内容组件
 */
function AppContent(): JSX.Element {
  // 当前主题状态
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 从localStorage读取主题
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  /**
   * 处理主题变化
   */
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    handleThemeChange(newTheme);
  };

  return (
    <div className={`app-container theme-${currentTheme}`}>
      {/* 侧边栏：文件树和搜索 */}
      <aside className="sidebar">
        {/* 侧边栏头部 */}
        <div className="sidebar-header">
          <h1 className="app-title">MindFlow</h1>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* 搜索栏 */}
        <SearchBar className="sidebar-search" />

        {/* 文件树 */}
        <div className="sidebar-content">
          <FileTree />
        </div>
      </aside>

      {/* 主区域：编辑器和文件列表 */}
      <main className="main-content">
        {/* 文件列表（标签页） */}
        <FileList className="file-list-bar" />

        {/* 编辑器占位符 - 需要后续集成编辑器组件 */}
        <div className="editor-container">
          <div className="editor-placeholder">
            <h2>Editor</h2>
            <p>Select a file to start editing</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * 桌面端应用主组件
 * @description 包含Redux Provider的主应用组件
 */
function App(): JSX.Element {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
