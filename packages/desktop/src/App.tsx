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
import { listen } from '@tauri-apps/api/event';
import { FileTree } from './components/FileTree';
import { FileList } from './components/FileList';
import { SearchBar } from './components/SearchBar';
import { Toolbar } from './components/Toolbar';
import Editor from './components/Editor';
import ThemeToggle from './components/Settings/ThemeToggle';
import SettingsDialog from './components/Settings/SettingsDialog';
import { store } from './store';
import { getFileTree, readFile, openFile } from './store/fileSystemSlice';
import { loadConfig } from './store/configSlice';
import { RootState } from './store';
import './styles.css';

/**
 * 主应用内容组件
 */
function AppContent(): JSX.Element {
  const dispatch = useDispatch();

  // 从 Redux 获取配置状态
  const config = useSelector((state: RootState) => state.config.config);

  // 从 Redux 获取当前文件
  const currentFile = useSelector((state: RootState) => state.fileSystem.currentFile);

  // 编辑器内容状态
  const [editorContent, setEditorContent] = React.useState<string>('# Welcome to MindFlow\n\nStart writing your markdown...');

  // 设置对话框状态
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  useEffect(() => {
    // 初始化配置
    const initConfig = async () => {
      try {
        await dispatch(loadConfig() as any);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };

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

    initConfig();
    initWorkspace();

    // 监听文件打开请求（通过文件关联或拖放）
    const unlistenFileOpen = listen<string>('file-open-request', async (event) => {
      const filePath = event.payload;
      console.log('File open request:', filePath);

      try {
        // 读取文件内容
        await dispatch(readFile(filePath) as any);

        // 创建一个临时的文件节点
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Untitled';
        const fileNode = {
          id: filePath,
          name: fileName,
          path: filePath,
          isDir: false,
          children: undefined,
          content: undefined,
          modifiedTime: Date.now() / 1000,
          size: 0,
        };

        // 打开文件
        dispatch(openFile(fileNode));
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    });

    // 监听文件拖放悬停事件
    const unlistenFileDropHover = listen<string[]>('file-drop-hover', (event) => {
      console.log('File drop hover:', event.payload);
      // 可以添加视觉反馈，例如高亮编辑器区域
    });

    // 监听文件拖放取消事件
    const unlistenFileDropCancelled = listen('file-drop-cancelled', () => {
      console.log('File drop cancelled');
      // 移除视觉反馈
    });

    return () => {
      // 清理事件监听器
      unlistenFileOpen.then((fn) => fn());
      unlistenFileDropHover.then((fn) => fn());
      unlistenFileDropCancelled.then((fn) => fn());
    };
  }, [dispatch]);

  /**
   * 处理编辑器内容变化
   */
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    // TODO: 保存到文件系统（后续实现）
    console.log('Editor content changed:', value.substring(0, 50) + '...');
  };

  // 获取当前显示的主题（处理 auto 模式）
  const getDisplayTheme = (): 'light' | 'dark' => {
    if (config.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.theme;
  };

  const displayTheme = getDisplayTheme();

  return (
    <div className={`app-container theme-${config.theme}`}>
      {/* 侧边栏：文件树和搜索 */}
      <aside className="sidebar">
        {/* 侧边栏头部 */}
        <div className="sidebar-header">
          <h1 className="app-title">MindFlow</h1>
          <div className="sidebar-header-actions">
            <button
              className="settings-button-icon"
              onClick={() => setIsSettingsOpen(true)}
              title="设置"
              aria-label="打开设置"
            >
              ⚙️
            </button>
            <ThemeToggle iconOnly={true} />
          </div>
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
              theme={displayTheme}
              autoSave={config.autoSave}
              autoSaveDelay={config.autoSaveDelay}
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

      {/* 设置对话框 */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
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
