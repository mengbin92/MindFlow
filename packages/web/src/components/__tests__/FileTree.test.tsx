import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FileTree } from '../FileTree';
import fileSystemReducer from '../../store/fileSystemSlice';
import type { FileTreeNode } from '@mindflow/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('FileTree Component', () => {
  const mockFileTree: FileTreeNode = {
    id: 'root',
    name: 'MindFlow',
    path: '',
    isDir: true,
    modifiedTime: Date.now() / 1000,
    children: [
      {
        id: 'file1',
        name: 'readme.md',
        path: 'readme.md',
        isDir: false,
        modifiedTime: Date.now() / 1000,
        content: '# README',
      },
      {
        id: 'docs',
        name: 'docs',
        path: 'docs',
        isDir: true,
        modifiedTime: Date.now() / 1000,
        children: [
          {
            id: 'guide',
            name: 'guide.md',
            path: 'docs/guide.md',
            isDir: false,
            modifiedTime: Date.now() / 1000,
            content: '# Guide',
          },
        ],
      },
    ],
  };

  const createStore = (initialState = {}) =>
    configureStore({
      reducer: {
        fileSystem: fileSystemReducer,
      },
      preloadedState: {
        fileSystem: {
          currentDirectory: '',
          fileTree: mockFileTree,
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
          ...initialState,
        },
      },
    });

  it('should render file tree with root folder', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );

    expect(screen.getByText('MindFlow')).toBeInTheDocument();
  });

  it('should render toolbar buttons', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );

    expect(screen.getByText('📄 新建文件')).toBeInTheDocument();
    expect(screen.getByText('📁 新建文件夹')).toBeInTheDocument();
    expect(screen.getByText('🔄 刷新')).toBeInTheDocument();
  });

  it('should show loading state when file tree is null', async () => {
    const store = createStore({ fileTree: null });
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  it('should open new file dialog when clicking 新建文件', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );

    fireEvent.click(screen.getByText('📄 新建文件'));
    expect(screen.getByText('新建文件')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入文件名（如: test.md）')).toBeInTheDocument();
  });

  it('should open new folder dialog when clicking 新建文件夹', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <FileTree />
      </Provider>
    );

    fireEvent.click(screen.getByText('📁 新建文件夹'));
    expect(screen.getByText('新建文件夹')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入文件夹名（如: docs）')).toBeInTheDocument();
  });
});
