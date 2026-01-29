/**
 * @fileoverview Web端文件系统状态管理
 * @description 使用Redux Toolkit管理文件系统状态（Web版）
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { FileTreeNode, FileOperationState, SearchResult } from '@mindflow/types';
import * as fsAdapter from './webFileSystemAdapter';

/**
 * 辅助函数：将节点添加到文件树
 * @description 根据节点的路径，将其添加到正确的父节点中，如果父节点不存在则自动创建
 */
function addNodeToFileTree(root: FileTreeNode, node: FileTreeNode): void {
  // 如果节点在根目录（没有父文件夹）
  if (!node.path.includes('/') || node.path.split('/').length === 1) {
    // 添加到根节点的children
    if (!root.children) {
      root.children = [];
    }
    // 检查是否已存在
    if (!root.children.find(child => child.path === node.path)) {
      root.children.push(node);
    }
    return;
  }

  // 节点在子目录中
  const pathParts = node.path.split('/');
  const parentPath = pathParts.slice(0, -1).join('/');

  // 递归查找或创建父节点
  function findOrCreateAndAdd(currentNode: FileTreeNode, targetPath: string): boolean {
    if (currentNode.path === targetPath) {
      // 找到父节点
      if (!currentNode.children) {
        currentNode.children = [];
      }
      // 检查是否已存在
      if (!currentNode.children.find(child => child.path === node.path)) {
        currentNode.children.push(node);
      }
      return true;
    }

    // 检查是否需要创建中间目录
    if (targetPath.startsWith(currentNode.path + '/')) {
      // 提取下一级路径
      const remainingPath = targetPath.substring(currentNode.path ? currentNode.path.length + 1 : 0);
      const nextPathPart = remainingPath.split('/')[0];
      const nextPath = currentNode.path ? `${currentNode.path}/${nextPathPart}` : nextPathPart;

      if (!currentNode.children) {
        currentNode.children = [];
      }

      // 查找下一级节点
      let nextNode = currentNode.children.find(child => child.path === nextPath);

      // 如果下一级节点不存在，创建它（作为文件夹）
      if (!nextNode) {
        nextNode = {
          id: nextPath,
          name: nextPathPart,
          path: nextPath,
          isDir: true,
          modifiedTime: Date.now() / 1000,
          children: [],
        };
        currentNode.children.push(nextNode);
      }

      // 递归处理
      return findOrCreateAndAdd(nextNode, targetPath);
    }

    // 递归搜索子节点
    if (currentNode.children) {
      for (const child of currentNode.children) {
        if (child.isDir && findOrCreateAndAdd(child, targetPath)) {
          return true;
        }
      }
    }

    return false;
  }

  findOrCreateAndAdd(root, parentPath);
}

// ==================== 状态接口 ====================

export interface FileSystemState {
  /** 当前工作目录 */
  currentDirectory: string;

  /** 文件树 */
  fileTree: FileTreeNode | null;

  /** 展开的文件夹路径列表 */
  expandedFolders: string[];

  /** 选中的文件路径 */
  selectedFile: string | null;

  /** 打开的文件列表 */
  openFiles: FileTreeNode[];

  /** 当前编辑的文件 */
  currentFile: FileTreeNode | null;

  /** 最近打开的文件 */
  recentFiles: FileTreeNode[];

  /** 搜索结果 */
  searchResults: SearchResult | null;

  /** 操作状态 */
  operationState: FileOperationState;

  /** 是否正在监听文件变化 */
  isWatching: boolean;
}

// ==================== 初始状态 ====================

const initialState: FileSystemState = {
  currentDirectory: '',
  fileTree: null,
  expandedFolders: [],
  selectedFile: null,
  openFiles: [],
  currentFile: null,
  recentFiles: [],
  searchResults: null,
  operationState: {
    isLoading: false,
    error: null,
    lastOperation: null,
  },
  isWatching: false,
};

// ==================== 异步 Thunks ====================

/**
 * 读取文件内容
 */
export const readFile = createAsyncThunk(
  'fileSystem/readFile',
  async (path: string) => {
    const content = await fsAdapter.readFile(path);
    return { path, content };
  }
);

/**
 * 写入文件
 */
export const writeFile = createAsyncThunk(
  'fileSystem/writeFile',
  async ({ path, content }: { path: string; content: string }) => {
    await fsAdapter.writeFile(path, content);
    return { path, content };
  }
);

/**
 * 创建文件
 */
export const createFile = createAsyncThunk(
  'fileSystem/createFile',
  async (path: string) => {
    const fileInfo = await fsAdapter.createFile(path);
    return fileInfo;
  }
);

/**
 * 创建文件夹
 */
export const createDir = createAsyncThunk(
  'fileSystem/create_dir',
  async (path: string) => {
    const dirInfo = await fsAdapter.createDir(path);
    return dirInfo;
  }
);

/**
 * 删除文件或文件夹
 */
export const deleteFile = createAsyncThunk(
  'fileSystem/delete_file',
  async (path: string) => {
    await fsAdapter.deleteFile(path);
    return path;
  }
);

/**
 * 重命名文件或文件夹
 */
export const renameFile = createAsyncThunk(
  'fileSystem/rename_file',
  async ({ oldPath, newPath }: { oldPath: string; newPath: string }) => {
    const fileInfo = await fsAdapter.renameFile(oldPath, newPath);
    return { oldPath, fileInfo };
  }
);

/**
 * 读取目录内容
 */
export const readDirectory = createAsyncThunk(
  'fileSystem/read_directory',
  async (path: string) => {
    const files = await fsAdapter.readDirectory(path);
    return { path, files };
  }
);

/**
 * 获取完整文件树
 */
export const getFileTree = createAsyncThunk(
  'fileSystem/get_file_tree',
  async (path: string) => {
    const fileTree = await fsAdapter.getFileTree(path);
    return { path, fileTree };
  }
);

/**
 * 搜索文件
 */
export const searchFiles = createAsyncThunk(
  'fileSystem/search_files',
  async ({ path, query }: { path: string; query: string }) => {
    const files = await fsAdapter.searchFiles(path, query);
    return { files, query };
  }
);

/**
 * 获取最近文件
 */
export const getRecentFiles = createAsyncThunk(
  'fileSystem/get_recent_files',
  async () => {
    const files = await fsAdapter.getRecentFiles();
    return files;
  }
);

/**
 * 监听目录变化
 */
export const watchDirectory = createAsyncThunk(
  'fileSystem/watch_directory',
  async (path: string) => {
    await fsAdapter.watchDirectory(path);
    return path;
  }
);

// ==================== Slice ====================

const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    /** 设置当前工作目录 */
    setCurrentDirectory: (state, action: PayloadAction<string>) => {
      state.currentDirectory = action.payload;
    },

    /** 切换文件夹展开状态 */
    toggleFolder: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const index = state.expandedFolders.indexOf(path);
      if (index !== -1) {
        state.expandedFolders.splice(index, 1);
      } else {
        state.expandedFolders.push(path);
      }
    },

    /** 设置选中的文件 */
    setSelectedFile: (state, action: PayloadAction<string | null>) => {
      state.selectedFile = action.payload;
    },

    /** 打开文件 */
    openFile: (state, action: PayloadAction<FileTreeNode>) => {
      const file = action.payload;
      const existingIndex = state.openFiles.findIndex(f => f.path === file.path);

      if (existingIndex === -1) {
        state.openFiles.push(file);
      }

      state.currentFile = file;
      state.selectedFile = file.path;

      // 保存到最近文件
      state.recentFiles = state.recentFiles.filter(f => f.path !== file.path);
      state.recentFiles.unshift(file);
      state.recentFiles = state.recentFiles.slice(0, 10); // 只保留最近10个

      // 持久化到localStorage
      try {
        localStorage.setItem('recentFiles', JSON.stringify(state.recentFiles));
      } catch (err) {
        console.warn('Failed to save recent files:', err);
      }
    },

    /** 关闭文件 */
    closeFile: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      state.openFiles = state.openFiles.filter(f => f.path !== path);

      if (state.currentFile?.path === path) {
        state.currentFile = state.openFiles.length > 0
          ? state.openFiles[state.openFiles.length - 1]
          : null;
      }
    },

    /** 清除搜索结果 */
    clearSearchResults: (state) => {
      state.searchResults = null;
    },

    /** 清除错误 */
    clearError: (state) => {
      state.operationState.error = null;
    },
  },
  extraReducers: (builder) => {
    // readFile
    builder
      .addCase(readFile.pending, (state) => {
        state.operationState.isLoading = true;
        state.operationState.error = null;
      })
      .addCase(readFile.fulfilled, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.lastOperation = Date.now();

        // 更新文件内容
        const { path, content } = action.payload;
        const file = state.openFiles.find(f => f.path === path);
        if (file) {
          file.content = content;
        }
      })
      .addCase(readFile.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to read file';
      });

    // writeFile
    builder
      .addCase(writeFile.pending, (state) => {
        state.operationState.isLoading = true;
        state.operationState.error = null;
      })
      .addCase(writeFile.fulfilled, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.lastOperation = Date.now();

        // 更新文件内容
        const { path, content } = action.payload;
        const file = state.openFiles.find(f => f.path === path);
        if (file) {
          file.content = content;
        }
      })
      .addCase(writeFile.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to write file';
      });

    // getFileTree
    builder
      .addCase(getFileTree.pending, (state) => {
        state.operationState.isLoading = true;
        state.operationState.error = null;
      })
      .addCase(getFileTree.fulfilled, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.lastOperation = Date.now();
        state.currentDirectory = action.payload.path;
        state.fileTree = action.payload.fileTree;
      })
      .addCase(getFileTree.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to get file tree';
      });

    // createFile
    builder
      .addCase(createFile.fulfilled, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = null;
        state.operationState.lastOperation = Date.now();

        // 将新创建的文件添加到文件树
        const newFile = action.payload;
        if (state.fileTree && newFile) {
          addNodeToFileTree(state.fileTree, newFile);
        }
      })
      .addCase(createFile.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to create file';
      });

    // createDir
    builder
      .addCase(createDir.fulfilled, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = null;
        state.operationState.lastOperation = Date.now();

        // 将新创建的文件夹添加到文件树
        const newDir = action.payload;
        if (state.fileTree && newDir) {
          addNodeToFileTree(state.fileTree, newDir);
        }
      })
      .addCase(createDir.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to create directory';
      });

    // searchFiles
    builder
      .addCase(searchFiles.fulfilled, (state, action) => {
        const { files, query } = action.payload;
        state.searchResults = {
          files,
          query,
          count: files.length,
        };
      });

    // getRecentFiles
    builder
      .addCase(getRecentFiles.fulfilled, (state, action) => {
        state.recentFiles = action.payload;
      });

    // watchDirectory
    builder
      .addCase(watchDirectory.fulfilled, (state) => {
        state.isWatching = true;
      });
  },
});

// ==================== 导出 ====================

export const {
  setCurrentDirectory,
  toggleFolder,
  setSelectedFile,
  openFile,
  closeFile,
  clearSearchResults,
  clearError,
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;
