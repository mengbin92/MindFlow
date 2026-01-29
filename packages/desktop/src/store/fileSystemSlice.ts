/**
 * @fileoverview 文件系统状态管理
 * @description 使用Redux Toolkit管理文件系统状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/tauri';
import type { FileTreeNode, FileOperationState, SearchResult } from '@mindflow/types';

// ==================== 状态接口 ====================

interface FileSystemState {
  /** 当前工作目录 */
  currentDirectory: string;

  /** 文件树 */
  fileTree: FileTreeNode | null;

  /** 展开的文件夹路径列表 */
  expandedFolders: Set<string>;

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
  expandedFolders: new Set(),
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
    const content = await invoke<string>('read_file', { path });
    return { path, content };
  }
);

/**
 * 写入文件
 */
export const writeFile = createAsyncThunk(
  'fileSystem/writeFile',
  async ({ path, content }: { path: string; content: string }) => {
    await invoke('write_file', { path, content });
    return { path, content };
  }
);

/**
 * 创建文件
 */
export const createFile = createAsyncThunk(
  'fileSystem/createFile',
  async (path: string) => {
    const fileInfo = await invoke<FileTreeNode>('create_file', { path });
    return fileInfo;
  }
);

/**
 * 创建文件夹
 */
export const createDir = createAsyncThunk(
  'fileSystem/create_dir',
  async (path: string) => {
    const dirInfo = await invoke<FileTreeNode>('create_dir', { path });
    return dirInfo;
  }
);

/**
 * 删除文件或文件夹
 */
export const deleteFile = createAsyncThunk(
  'fileSystem/delete_file',
  async (path: string) => {
    await invoke('delete_file', { path });
    return path;
  }
);

/**
 * 重命名文件或文件夹
 */
export const renameFile = createAsyncThunk(
  'fileSystem/rename_file',
  async ({ oldPath, newPath }: { oldPath: string; newPath: string }) => {
    const fileInfo = await invoke<FileTreeNode>('rename_file', {
      oldPath,
      newPath,
    });
    return { oldPath, fileInfo };
  }
);

/**
 * 读取目录内容
 */
export const readDirectory = createAsyncThunk(
  'fileSystem/read_directory',
  async (path: string) => {
    const files = await invoke<FileTreeNode[]>('read_directory', { path });
    return { path, files };
  }
);

/**
 * 获取完整文件树
 */
export const getFileTree = createAsyncThunk(
  'fileSystem/get_file_tree',
  async (path: string) => {
    const fileTree = await invoke<FileTreeNode>('get_file_tree', { path });
    return { path, fileTree };
  }
);

/**
 * 搜索文件
 */
export const searchFiles = createAsyncThunk(
  'fileSystem/search_files',
  async ({ path, query }: { path: string; query: string }) => {
    const files = await invoke<FileTreeNode[]>('search_files', { path, query });
    return { files, query };
  }
);

/**
 * 获取最近文件
 */
export const getRecentFiles = createAsyncThunk(
  'fileSystem/get_recent_files',
  async () => {
    const files = await invoke<FileTreeNode[]>('get_recent_files', {});
    return files;
  }
);

/**
 * 监听目录变化
 */
export const watchDirectory = createAsyncThunk(
  'fileSystem/watch_directory',
  async (path: string) => {
    await invoke('watch_directory', { path });
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
      if (state.expandedFolders.has(path)) {
        state.expandedFolders.delete(path);
      } else {
        state.expandedFolders.add(path);
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
      .addCase(createFile.pending, (state) => {
        state.operationState.isLoading = true;
        state.operationState.error = null;
      })
      .addCase(createFile.fulfilled, (state) => {
        state.operationState.isLoading = false;
        state.operationState.lastOperation = Date.now();
      })
      .addCase(createFile.rejected, (state, action) => {
        state.operationState.isLoading = false;
        state.operationState.error = action.error.message || 'Failed to create file';
      });

    // createDir
    builder
      .addCase(createDir.pending, (state) => {
        state.operationState.isLoading = true;
        state.operationState.error = null;
      })
      .addCase(createDir.fulfilled, (state) => {
        state.operationState.isLoading = false;
        state.operationState.lastOperation = Date.now();
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
