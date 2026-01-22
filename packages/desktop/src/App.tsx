/**
 * @fileoverview 桌面端应用主组件
 * @description MindFlow 桌面端的主应用组件，包含三栏布局和文件管理
 * @module packages/desktop/App
 * @author MindFlow Team
 * @license MIT
 */

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { FileTree } from './components/FileTree';
import { FileList } from './components/FileList';
import { SearchBar } from './components/SearchBar';
import { Toolbar } from './components/Toolbar';
import Editor from './components/Editor';
import { store } from './store';
import { getFileTree } from './store/fileSystemSlice';
import { RootState } from './store';
import './styles.css';

/**
 * 主应用内容组件
 */
function AppContent(): JSX.Element {
  const dispatch = useDispatch();
  // 当前主题状态
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('light');

  // 从 Redux 获取当前文件
  const currentFile = useSelector((state: RootState) => state.fileSystem.currentFile);

  // 编辑器内容状态
  const [editorContent, setEditorContent] = React.useState<string>('# Welcome to MindFlow\n\nStart writing your markdown...');

  useEffect(() => {
    // 从localStorage读取主题
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }

    // 初始化工作目录
    const initWorkspace = async () => {
      try {
        // 默认使用用户主目录下的 MindFlow 文件夹
        // 路径将在 Rust 端解析，使用 ~ 作为主目录的快捷方式
        dispatch(getFileTree('~/MindFlow') as any);
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
      }
    };

    initWorkspace();
  }, [dispatch]);

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

  /**
   * 处理编辑器内容变化
   */
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    // TODO: 保存到文件系统（后续实现）
    console.log('Editor content changed:', value.substring(0, 50) + '...');
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

        {/* 工具栏 */}
        <Toolbar className="sidebar-toolbar" />

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

        {/* 编辑器 */}
        <div className="editor-container">
          {currentFile ? (
            <Editor
              initialValue={editorContent}
              docId={currentFile.path}
              theme={currentTheme}
              autoSave={true}
              onChange={handleEditorChange}
            />
          ) : (
            <div className="editor-placeholder">
              <h2>👋 Welcome to MindFlow</h2>
              <p>Select a file from the sidebar to start editing</p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
                Or create a new file using the toolbar above
              </p>
            </div>
          )}
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
