/**
 * @fileoverview 文件树组件
 * @description 显示文件和文件夹的层次结构
 */

import React, { useState } from 'react';
import type { FileTreeNode } from '@mindflow/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  toggleFolder,
  setSelectedFile,
  openFile,
  getFileTree,
  createFile,
  createDir,
} from '../store/fileSystemSlice';
import './FileTree.css';

// ==================== 文件树节点组件 ====================

interface FileTreeNodeProps {
  node: FileTreeNode;
  level: number;
  path: string;
}

const FileTreeNodeComponent: React.FC<FileTreeNodeProps> = ({ node, level, path }) => {
  const dispatch = useAppDispatch();
  const expandedFolders = useAppSelector(state => state.fileSystem.expandedFolders);
  const selectedFile = useAppSelector(state => state.fileSystem.selectedFile);
  const nodePath = path ? `${path}/${node.name}` : node.name;

  const isExpanded = expandedFolders.includes(nodePath);
  const isSelected = selectedFile === nodePath;
  const [isLoading, setIsLoading] = useState(false);

  // 处理文件夹点击
  const handleFolderClick = () => {
    dispatch(toggleFolder(nodePath));
  };

  // 处理文件点击
  const handleFileClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 从localStorage加载文件内容
      const content = localStorage.getItem(`file:${nodePath}`);

      // 打开文件（包含最新内容）
      dispatch(openFile({
        ...node,
        path: nodePath,
        content: content || '',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理双击
  const handleDoubleClick = () => {
    dispatch(setSelectedFile(nodePath));
  };

  // 缩进样式
  const indentStyle = {
    paddingLeft: `${level * 16 + 8}px`,
  };

  return (
    <div>
      {/* 节点标签 */}
      <div
        className={`file-tree-node ${node.isDir ? 'folder' : 'file'} ${isSelected ? 'selected' : ''}`}
        style={indentStyle}
        onClick={node.isDir ? handleFolderClick : handleFileClick}
        onDoubleClick={handleDoubleClick}
        title={node.name}
      >
        {/* 文件夹/文件图标 */}
        <span className="file-tree-icon">
          {node.isDir ? (
            <span className="folder-icon">
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="file-icon">
              📄
            </span>
          )}
        </span>

        {/* 文件名 */}
        <span className="file-tree-name">
          {node.name}
        </span>

        {/* 加载指示器 */}
        {isLoading && (
          <span className="file-tree-loading">⏳</span>
        )}
      </div>

      {/* 子节点 */}
      {node.isDir && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.map(child => (
            <FileTreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              path={nodePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 文件树主组件 ====================

interface FileTreeProps {
  className?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const fileTree = useAppSelector(state => state.fileSystem.fileTree);
  const selectedFile = useAppSelector(state => state.fileSystem.selectedFile);
  // 文件系统操作状态（保留用于未来扩展）
  useAppSelector(state => state.fileSystem.operationState.isLoading);

  // 新建文件/文件夹的状态
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewDirDialog, setShowNewDirDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPath, setNewItemPath] = useState('');

  // 处理刷新文件树
  const handleRefresh = () => {
    dispatch(getFileTree(''));
  };

  // 获取当前选中的文件夹路径
  const getSelectedFolderPath = (): string => {
    if (!selectedFile) return '';
    // 如果选中的是文件夹，返回该路径
    // 如果选中的是文件，返回其所在目录
    const node = findNodeByPath(fileTree, selectedFile);
    if (node?.isDir) {
      return selectedFile;
    }
    // 获取父目录
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
    setNewItemPath(folderPath);
    setNewItemName('');
    setShowNewFileDialog(true);
  };

  // 处理新建文件夹
  const handleNewDir = () => {
    const folderPath = getSelectedFolderPath();
    setNewItemPath(folderPath);
    setNewItemName('');
    setShowNewDirDialog(true);
  };

  // 确认新建文件
  const handleConfirmNewFile = () => {
    if (!newItemName.trim()) return;

    const path = newItemPath ? `${newItemPath}/${newItemName}` : newItemName;

    dispatch(createFile(path))
      .unwrap()
      .then(() => {
        setShowNewFileDialog(false);
        setNewItemName('');
        // Redux reducer会自动更新文件树
      })
      .catch((error: Error) => {
        console.error('Failed to create file:', error);
        alert(`创建文件失败: ${error.message}`);
      });
  };

  // 确认新建文件夹
  const handleConfirmNewDir = () => {
    if (!newItemName.trim()) return;

    const path = newItemPath ? `${newItemPath}/${newItemName}` : newItemName;

    dispatch(createDir(path))
      .unwrap()
      .then(() => {
        setShowNewDirDialog(false);
        setNewItemName('');
        // Redux reducer会自动更新文件树
      })
      .catch((error: Error) => {
        console.error('Failed to create directory:', error);
        alert(`创建文件夹失败: ${error.message}`);
      });
  };

  // 取消新建
  const handleCancelNew = () => {
    setShowNewFileDialog(false);
    setShowNewDirDialog(false);
    setNewItemName('');
    setNewItemPath('');
  };

  // 处理回车键确认
  const handleKeyPress = (e: React.KeyboardEvent, isDir: boolean) => {
    if (e.key === 'Enter') {
      if (isDir) {
        handleConfirmNewDir();
      } else {
        handleConfirmNewFile();
      }
    } else if (e.key === 'Escape') {
      handleCancelNew();
    }
  };

  // 空状态 - 自动加载或显示刷新按钮
  if (!fileTree) {
    // 自动加载localStorage中的文件树
    dispatch(getFileTree(''));

    return (
      <div className={`file-tree file-tree-empty ${className}`}>
        <div className="file-tree-empty-message">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-tree ${className}`}>
      {/* 文件树工具栏 */}
      <div className="file-tree-toolbar">
        <button
          className="toolbar-button"
          onClick={handleNewFile}
          title="新建文件"
        >
          📄 新建文件
        </button>
        <button
          className="toolbar-button"
          onClick={handleNewDir}
          title="新建文件夹"
        >
          📁 新建文件夹
        </button>
        <button
          className="toolbar-button"
          onClick={handleRefresh}
          title="刷新文件树"
        >
          🔄 刷新
        </button>
      </div>

      {/* 文件树根节点 */}
      <FileTreeNodeComponent
        node={fileTree}
        level={0}
        path=""
      />

      {/* 新建文件对话框 */}
      {showNewFileDialog && (
        <div className="file-tree-dialog-overlay" onClick={handleCancelNew}>
          <div className="file-tree-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>新建文件</h3>
            {newItemPath && (
              <div className="file-tree-dialog-path">
                📁 {newItemPath}/
              </div>
            )}
            <input
              type="text"
              className="file-tree-input"
              placeholder="输入文件名（如: test.md）"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, false)}
              autoFocus
            />
            <div className="file-tree-dialog-hint">
              {newItemPath
                ? `文件将创建在 ${newItemPath}/ 目录下`
                : '文件将创建在根目录下'}
            </div>
            <div className="file-tree-dialog-buttons">
              <button
                className="dialog-button primary"
                onClick={handleConfirmNewFile}
                disabled={!newItemName.trim()}
              >
                创建
              </button>
              <button
                className="dialog-button"
                onClick={handleCancelNew}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建文件夹对话框 */}
      {showNewDirDialog && (
        <div className="file-tree-dialog-overlay" onClick={handleCancelNew}>
          <div className="file-tree-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>新建文件夹</h3>
            {newItemPath && (
              <div className="file-tree-dialog-path">
                📁 {newItemPath}/
              </div>
            )}
            <input
              type="text"
              className="file-tree-input"
              placeholder="输入文件夹名（如: docs）"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, true)}
              autoFocus
            />
            <div className="file-tree-dialog-hint">
              {newItemPath
                ? `文件夹将创建在 ${newItemPath}/ 目录下`
                : '文件夹将创建在根目录下'}
            </div>
            <div className="file-tree-dialog-buttons">
              <button
                className="dialog-button primary"
                onClick={handleConfirmNewDir}
                disabled={!newItemName.trim()}
              >
                创建
              </button>
              <button
                className="dialog-button"
                onClick={handleCancelNew}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTree;
