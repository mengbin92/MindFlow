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
  _path: string
): Promise<FileTreeNode> {
  const file = await ((handle as unknown) as FileSystemFileHandle).getFile();
  return {
    id: _path,
    name: handle.name,
    path: _path,
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
      children.push(await buildFileTree(((handle as unknown) as FileSystemDirectoryHandle), fullPath));
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

  // 检查文件是否已存在
  const existingContent = localStorage.getItem(`file:${path}`);
  if (existingContent !== null) {
    throw new Error(`File already exists: ${path}`);
  }

  // 如果文件在子目录中，自动创建父目录
  const pathParts = path.split('/');
  if (pathParts.length > 1) {
    const parentPath = pathParts.slice(0, -1).join('/');

    // 递归创建父目录
    let currentPath = '';
    for (const part of pathParts.slice(0, -1)) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // 检查目录是否已存在
      const dirKey = `dir:${currentPath}`;
      if (!localStorage.getItem(dirKey)) {
        localStorage.setItem(dirKey, JSON.stringify([]));
      }
    }
  }

  // 创建空文件并保存到localStorage
  const emptyContent = '';
  localStorage.setItem(`file:${path}`, emptyContent);

  // 创建文件节点
  const fileNode: FileTreeNode = {
    id: path,
    name,
    path,
    isDir: false,
    modifiedTime: Date.now() / 1000,
    content: emptyContent,
  };

  return fileNode;
}

/**
 * 创建文件夹
 */
export async function createDir(path: string): Promise<FileTreeNode> {
  const name = path.split('/').pop() || path;

  // 检查文件夹是否已存在
  const existingDir = localStorage.getItem(`dir:${path}`);
  if (existingDir !== null) {
    throw new Error(`Directory already exists: ${path}`);
  }

  // 创建文件夹并保存到localStorage（保存为空数组）
  localStorage.setItem(`dir:${path}`, JSON.stringify([]));

  // 创建文件夹节点
  const dirNode: FileTreeNode = {
    id: path,
    name,
    path,
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children: [],
  };

  return dirNode;
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
  // Web版直接从localStorage构建文件树
  const fileTree = await buildFileTreeFromLocalStorage();
  return fileTree;
}

/**
 * 从localStorage构建文件树
 * @description 扫描localStorage中的所有文件和文件夹，构建完整的文件树
 */
async function buildFileTreeFromLocalStorage(): Promise<FileTreeNode> {
  const files: Map<string, FileTreeNode> = new Map();
  const dirs: Map<string, FileTreeNode> = new Map();

  // 扫描localStorage中的所有文件和文件夹
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith('file:')) {
      // 文件
      const filePath = key.replace('file:', '');
      const content = localStorage.getItem(key) || '';

      const name = filePath.split('/').pop() || filePath;
      const fileNode: FileTreeNode = {
        id: filePath,
        name,
        path: filePath,
        isDir: false,
        modifiedTime: Date.now() / 1000,
        content,
      };

      files.set(filePath, fileNode);
    } else if (key.startsWith('dir:')) {
      // 文件夹
      const dirPath = key.replace('dir:', '');
      const name = dirPath.split('/').pop() || dirPath;

      const dirNode: FileTreeNode = {
        id: dirPath,
        name,
        path: dirPath,
        isDir: true,
        modifiedTime: Date.now() / 1000,
        children: [],
      };

      dirs.set(dirPath, dirNode);
    }
  }

  // 如果没有任何文件，返回默认的演示文件树
  if (files.size === 0 && dirs.size === 0) {
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

  // 构建文件树结构
  const root: FileTreeNode = {
    id: 'root',
    name: 'MindFlow',
    path: '',
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children: [],
  };

  // 将所有节点添加到根节点
  const allNodes = new Map([...files, ...dirs]);

  // 按路径深度排序，确保父节点先被处理
  const sortedPaths = Array.from(allNodes.keys()).sort((a, b) => {
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    return aDepth - bDepth;
  });

  // 构建树结构
  for (const nodePath of sortedPaths) {
    const node = allNodes.get(nodePath)!;

    // 如果是根级文件或文件夹，直接添加到根节点
    if (!nodePath.includes('/')) {
      if (!root.children) {
        root.children = [];
      }
      root.children.push(node);
    } else {
      // 找到父节点并添加
      const parentPath = nodePath.substring(0, nodePath.lastIndexOf('/'));
      const parent = dirs.get(parentPath);

      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        // 检查是否已存在
        if (!parent.children.find(child => child.path === nodePath)) {
          parent.children.push(node);
        }
      }
    }
  }

  // 对children进行排序（文件夹在前，文件在后，按字母排序）
  function sortChildren(node: FileTreeNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      // 递归排序子节点
      node.children.forEach(child => {
        if (child.isDir) {
          sortChildren(child);
        }
      });
    }
  }

  sortChildren(root);

  return root;
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
export async function watchDirectory(_path: string): Promise<void> {
  console.warn('File watching is not supported in web environment');
}
