/**
 * @fileoverview Web端文件系统适配器
 * @description 使用File System Access API实现文件系统功能
 */

import type { FileTreeNode } from '@mindflow/types';

// ==================== 类型定义 ====================

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?: () => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: () => Promise<FileSystemFileHandle>;
  }
}

// ==================== 工具函数 ====================

/**
 * 将FileSystemHandle转换为FileTreeNode
 */
async function handleToFileTreeNode(
  handle: FileSystemHandle,
  path: string
): Promise<FileTreeNode> {
  const file = await (handle as FileSystemFileHandle).getFile();
  return {
    id: path,
    name: handle.name,
    path,
    isDir: false,
    size: file.size,
    modifiedTime: file.lastModified ? Math.floor(file.lastModified / 1000) : Date.now() / 1000,
    content: await file.text(),
  };
}

/**
 * 递归构建文件树
 */
async function buildFileTree(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<FileTreeNode> {
  const children: FileTreeNode[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    const fullPath = path ? `${path}/${name}` : name;

    if (handle.kind === 'directory') {
      children.push(await buildFileTree(handle as FileSystemDirectoryHandle, fullPath));
    } else {
      children.push(await handleToFileTreeNode(handle, fullPath));
    }
  }

  // 排序：目录在前，文件在后
  children.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    id: path || 'root',
    name: dirHandle.name,
    path: path || '',
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children,
  };
}

// ==================== API函数 ====================

/**
 * 读取文件内容
 */
export async function readFile(path: string): Promise<string> {
  // Web端使用IndexedDB存储文件内容
  const content = localStorage.getItem(`file:${path}`);
  if (content === null) {
    throw new Error('File not found');
  }
  return content;
}

/**
 * 写入文件
 */
export async function writeFile(path: string, content: string): Promise<void> {
  localStorage.setItem(`file:${path}`, content);
}

/**
 * 创建文件
 */
export async function createFile(path: string): Promise<FileTreeNode> {
  const name = path.split('/').pop() || path;
  return {
    id: path,
    name,
    path,
    isDir: false,
    modifiedTime: Date.now() / 1000,
    content: '',
  };
}

/**
 * 创建文件夹
 */
export async function createDir(path: string): Promise<FileTreeNode> {
  const name = path.split('/').pop() || path;
  return {
    id: path,
    name,
    path,
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children: [],
  };
}

/**
 * 删除文件或文件夹
 */
export async function deleteFile(path: string): Promise<void> {
  localStorage.removeItem(`file:${path}`);
}

/**
 * 重命名文件或文件夹
 */
export async function renameFile(oldPath: string, newPath: string): Promise<FileTreeNode> {
  // 读取旧文件内容
  const content = await readFile(oldPath);
  // 写入新路径
  await writeFile(newPath, content);
  // 删除旧文件
  await deleteFile(oldPath);

  const name = newPath.split('/').pop() || newPath;
  return {
    id: newPath,
    name,
    path: newPath,
    isDir: false,
    modifiedTime: Date.now() / 1000,
    content,
  };
}

/**
 * 读取目录内容
 */
export async function readDirectory(path: string): Promise<FileTreeNode[]> {
  // Web端从localStorage读取目录结构
  const dirData = localStorage.getItem(`dir:${path}`);
  if (!dirData) {
    return [];
  }
  return JSON.parse(dirData);
}

/**
 * 获取完整文件树
 */
export async function getFileTree(path: string): Promise<FileTreeNode> {
  // Web端使用默认的演示文件树
  if (typeof window !== 'undefined' && window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      return buildFileTree(dirHandle, path);
    } catch (err) {
      // 用户取消或API不支持
      console.warn('Directory picker not available or cancelled:', err);
    }
  }

  // 返回默认的演示文件树
  return {
    id: 'root',
    name: 'MindFlow',
    path: '',
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children: [
      {
        id: 'welcome',
        name: 'Welcome.md',
        path: 'Welcome.md',
        isDir: false,
        modifiedTime: Date.now() / 1000,
        content: '# Welcome to MindFlow\n\nThis is a minimalist Markdown editor.',
      },
      {
        id: 'docs',
        name: 'docs',
        path: 'docs',
        isDir: true,
        modifiedTime: Date.now() / 1000,
        children: [
          {
            id: 'docs/guide',
            name: 'guide.md',
            path: 'docs/guide.md',
            isDir: false,
            modifiedTime: Date.now() / 1000,
            content: '# Guide\n\nDocumentation goes here.',
          },
        ],
      },
    ],
  };
}

/**
 * 搜索文件
 */
export async function searchFiles(path: string, query: string): Promise<FileTreeNode[]> {
  // 简化实现：从localStorage搜索
  const results: FileTreeNode[] = [];
  const prefix = path ? `${path}/` : '';

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('file:') && key.toLowerCase().includes(query.toLowerCase())) {
      const filePath = key.replace('file:', '');
      if (filePath.startsWith(prefix)) {
        const content = localStorage.getItem(key) || '';
        results.push({
          id: filePath,
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          isDir: false,
          modifiedTime: Date.now() / 1000,
          content,
        });
      }
    }
  }

  return results;
}

/**
 * 获取最近文件
 */
export async function getRecentFiles(): Promise<FileTreeNode[]> {
  const recent = localStorage.getItem('recentFiles');
  if (!recent) {
    return [];
  }
  return JSON.parse(recent);
}

/**
 * 监听目录变化（Web端暂不支持）
 */
export async function watchDirectory(path: string): Promise<void> {
  console.warn('File watching is not supported in web environment');
}
