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
      // 打开文件
      dispatch(openFile({
        ...node,
        path: nodePath,
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
  const isLoading = useAppSelector(state => state.fileSystem.operationState.isLoading);

  // 处理打开目录
  const handleOpenDirectory = () => {
    dispatch(getFileTree(''));
  };

  // 空状态 - 显示打开目录按钮
  if (!fileTree) {
    return (
      <div className={`file-tree file-tree-empty ${className}`}>
        <div className="file-tree-empty-message">
          <p>No directory selected</p>
          <button
            className="open-directory-button"
            onClick={handleOpenDirectory}
            disabled={isLoading}
          >
            {isLoading ? 'Opening...' : '📂 Open Directory'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-tree ${className}`}>
      {/* 文件树根节点 */}
      <FileTreeNodeComponent
        node={fileTree}
        level={0}
        path=""
      />
    </div>
  );
};

export default FileTree;
