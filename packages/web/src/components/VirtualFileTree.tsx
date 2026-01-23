/**
 * @fileoverview 虚拟滚动文件树组件
 * @description 使用虚拟滚动优化的大规模文件树组件
 * @module packages/web/components/VirtualFileTree
 * @author MindFlow Team
 * @license MIT
 */

import React, { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectFile,
  toggleFolder,
  createFile,
  createFolder,
  deleteFile,
} from '../store/fileSystemSlice';
import { VirtualList } from './VirtualList';
import './FileTree.css';

/**
 * 文件节点类型
 */
interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isExpanded?: boolean;
}

/**
 * 文件树节点属性
 */
interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  isSelected: boolean;
}

/**
 * 文件树节点组件（使用React.memo优化）
 */
const FileTreeNode = React.memo<FileTreeNodeProps>(
  ({ node, level, isSelected }) => {
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => {
      if (node.type === 'folder') {
        dispatch(toggleFolder(node.path));
      } else {
        dispatch(selectFile(node.path));
      }
    }, [dispatch, node]);

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`确定要删除 ${node.name} 吗？`)) {
          dispatch(deleteFile(node.path));
        }
      },
      [dispatch, node]
    );

    return (
      <div
        className={`file-tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 10}px` }}
        onClick={handleClick}
      >
        <span className="file-tree-icon">
          {node.type === 'folder' ? (node.isExpanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="file-tree-name">{node.name}</span>
        <button
          className="file-tree-delete"
          onClick={handleDelete}
          aria-label="Delete"
        >
          ×
        </button>
      </div>
    );
  }
);

FileTreeNode.displayName = 'FileTreeNode';

/**
 * 扁平化文件树（用于虚拟滚动）
 */
function flattenFileTree(
  nodes: FileNode[],
  level = 0
): Array<{ node: FileNode; level: number }> {
  const result: Array<{ node: FileNode; level: number }> = [];

  for (const node of nodes) {
    result.push({ node, level });

    if (node.type === 'folder' && node.isExpanded && node.children) {
      result.push(...flattenFileTree(node.children, level + 1));
    }
  }

  return result;
}

/**
 * 虚拟滚动文件树组件属性
 */
interface VirtualFileTreeProps {
  className?: string;
  height?: number;
}

/**
 * 虚拟滚动文件树组件
 */
export const VirtualFileTree: React.FC<VirtualFileTreeProps> = ({
  className = '',
  height = 600,
}) => {
  const dispatch = useAppDispatch();
  const fileTree = useAppSelector(state => state.fileSystem.fileTree);
  const selectedFile = useAppSelector(state => state.fileSystem.selectedFile);

  // 将文件树扁平化用于虚拟滚动
  const flattenedNodes = useMemo(() => {
    return flattenFileTree(fileTree);
  }, [fileTree]);

  // 渲染单个节点
  const renderNode = useCallback(
    ({ node, level }: { node: FileNode; level: number }) => (
      <FileTreeNode
        key={node.path}
        node={node}
        level={level}
        isSelected={selectedFile === node.path}
      />
    ),
    [selectedFile]
  );

  // 处理新建文件
  const handleCreateFile = useCallback(() => {
    const name = prompt('请输入文件名：');
    if (name) {
      dispatch(createFile(name));
    }
  }, [dispatch]);

  // 处理新建文件夹
  const handleCreateFolder = useCallback(() => {
    const name = prompt('请输入文件夹名：');
    if (name) {
      dispatch(createFolder(name));
    }
  }, [dispatch]);

  return (
    <div className={`file-tree-container ${className}`}>
      <div className="file-tree-toolbar">
        <button onClick={handleCreateFile} title="新建文件">
          📄 新建文件
        </button>
        <button onClick={handleCreateFolder} title="新建文件夹">
          📁 新建文件夹
        </button>
      </div>
      <VirtualList
        items={flattenedNodes}
        renderItem={renderNode}
        itemHeight={32}
        height={height}
        overscan={5}
        className="file-tree-list"
      />
    </div>
  );
};

export default VirtualFileTree;
