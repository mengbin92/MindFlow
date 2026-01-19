/**
 * @fileoverview 工具栏组件
 * @description 提供文件操作的快捷按钮
 * @module packages/desktop/components/Toolbar
 * @author MindFlow Team
 * @license MIT
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { open } from '@tauri-apps/api/dialog';
import { InputDialog } from './InputDialog';
import type { RootState } from '../store';
import { getFileTree, createFile, createDir } from '../store/fileSystemSlice';
import './Toolbar.css';

/**
 * 工具栏组件属性
 */
interface ToolbarProps {
  /** CSS 类名 */
  className?: string;
}

/**
 * 工具栏组件
 */
export const Toolbar: React.FC<ToolbarProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const currentDirectory = useSelector((state: RootState) => state.fileSystem.currentDirectory);
  const operationState = useSelector((state: RootState) => state.fileSystem.operationState);

  // 对话框状态
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  /**
   * 打开文件夹
   */
  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择工作目录',
      });

      if (selected && typeof selected === 'string') {
        dispatch(getFileTree(selected) as any);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  /**
   * 新建文件
   */
  const handleCreateFile = () => {
    if (!currentDirectory) {
      alert('请先打开一个文件夹');
      return;
    }
    setShowFileDialog(true);
  };

  /**
   * 确认创建文件
   */
  const handleConfirmFile = async (fileName: string) => {
    const filePath = `${currentDirectory}/${fileName}`;
    console.log('Creating file:', filePath);
    try {
      // 创建文件
      await dispatch(createFile(filePath) as any);
      console.log('File created successfully');

      // 关闭对话框
      setShowFileDialog(false);

      // 刷新文件树
      console.log('Refreshing file tree for:', currentDirectory);
      await dispatch(getFileTree(currentDirectory) as any);
      console.log('File tree refreshed');
    } catch (error: any) {
      console.error('Create file error:', error);
      alert(`创建文件失败: ${error?.message || error}`);
    }
  };

  /**
   * 新建文件夹
   */
  const handleCreateFolder = () => {
    if (!currentDirectory) {
      alert('请先打开一个文件夹');
      return;
    }
    setShowFolderDialog(true);
  };

  /**
   * 确认创建文件夹
   */
  const handleConfirmFolder = async (folderName: string) => {
    const folderPath = `${currentDirectory}/${folderName}`;
    console.log('Creating folder:', folderPath);
    try {
      // 创建文件夹
      await dispatch(createDir(folderPath) as any);
      console.log('Folder created successfully');

      // 关闭对话框
      setShowFolderDialog(false);

      // 刷新文件树
      console.log('Refreshing file tree for:', currentDirectory);
      await dispatch(getFileTree(currentDirectory) as any);
      console.log('File tree refreshed');
    } catch (error: any) {
      console.error('Create folder error:', error);
      alert(`创建文件夹失败: ${error?.message || error}`);
    }
  };

  return (
    <>
      <div className={`toolbar ${className}`}>
        <button
          className="toolbar-button"
          onClick={handleOpenFolder}
          disabled={operationState.isLoading}
          title="打开文件夹"
        >
          📁 打开
        </button>
        <button
          className="toolbar-button"
          onClick={handleCreateFile}
          disabled={!currentDirectory || operationState.isLoading}
          title="新建文件"
        >
          📄 新建文件
        </button>
        <button
          className="toolbar-button"
          onClick={handleCreateFolder}
          disabled={!currentDirectory || operationState.isLoading}
          title="新建文件夹"
        >
          📁 新建文件夹
        </button>
        {operationState.isLoading && (
          <span className="toolbar-loading">处理中...</span>
        )}
      </div>

      {/* 文件创建对话框 */}
      {showFileDialog && (
        <InputDialog
          title="新建文件"
          message="请输入文件名:"
          defaultValue="untitled.md"
          placeholder="例如: document.md"
          onConfirm={handleConfirmFile}
          onCancel={() => setShowFileDialog(false)}
        />
      )}

      {/* 文件夹创建对话框 */}
      {showFolderDialog && (
        <InputDialog
          title="新建文件夹"
          message="请输入文件夹名:"
          defaultValue="new-folder"
          placeholder="例如: 我的文档"
          onConfirm={handleConfirmFolder}
          onCancel={() => setShowFolderDialog(false)}
        />
      )}
    </>
  );
};
