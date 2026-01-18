/**
 * @fileoverview 文件列表组件
 * @description 显示打开的文件标签页
 */

import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeFile, setSelectedFile } from '../store/fileSystemSlice';
import './FileList.css';

// ==================== 文件标签组件 ====================

interface FileTabProps {
  file: {
    path: string;
    name: string;
  };
  isActive: boolean;
}

const FileTab: React.FC<FileTabProps> = ({ file, isActive }) => {
  const dispatch = useAppDispatch();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(closeFile(file.path));
  };

  const handleClick = () => {
    dispatch(setSelectedFile(file.path));
  };

  return (
    <div
      className={`file-tab ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      title={file.path}
    >
      <span className="file-tab-icon">📄</span>
      <span className="file-tab-name">{file.name}</span>
      <button
        className="file-tab-close"
        onClick={handleClose}
        aria-label="Close file"
      >
        ×
      </button>
    </div>
  );
};

// ==================== 文件列表主组件 ====================

interface FileListProps {
  className?: string;
}

export const FileList: React.FC<FileListProps> = ({ className = '' }) => {
  const openFiles = useAppSelector(state => state.fileSystem.openFiles);
  const selectedFile = useAppSelector(state => state.fileSystem.selectedFile);

  if (openFiles.length === 0) {
    return (
      <div className={`file-list file-list-empty ${className}`}>
        <div className="file-list-empty-message">
          No files open
        </div>
      </div>
    );
  }

  return (
    <div className={`file-list ${className}`}>
      {openFiles.map(file => (
        <FileTab
          key={file.path}
          file={file}
          isActive={selectedFile === file.path}
        />
      ))}
    </div>
  );
};

export default FileList;
