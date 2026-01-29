import { describe, it, expect, beforeEach } from 'vitest';
import fileSystemReducer, {
  setCurrentDirectory,
  setSelectedFile,
  toggleFolder,
  openFile,
  closeFile,
  clearSearchResults,
  type FileSystemState,
} from '../fileSystemSlice';
import type { FileTreeNode } from '@mindflow/types';

describe('fileSystemSlice', () => {
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

  const createMockFile = (path: string, name: string): FileTreeNode => ({
    id: path,
    name,
    path,
    isDir: false,
    content: '',
    modifiedTime: Date.now() / 1000,
  });

  beforeEach(() => {
    // Reset state before each test
  });

  describe('setCurrentDirectory', () => {
    it('should set the current directory', () => {
      const state = fileSystemReducer(initialState, setCurrentDirectory('/docs'));
      expect(state.currentDirectory).toBe('/docs');
    });
  });

  describe('setSelectedFile', () => {
    it('should set the selected file path', () => {
      const state = fileSystemReducer(initialState, setSelectedFile('/path/to/file.md'));
      expect(state.selectedFile).toBe('/path/to/file.md');
    });

    it('should clear selected file when null is passed', () => {
      const stateWithSelection = { ...initialState, selectedFile: '/some/file.md' };
      const state = fileSystemReducer(stateWithSelection, setSelectedFile(null));
      expect(state.selectedFile).toBeNull();
    });
  });

  describe('toggleFolder', () => {
    it('should add folder to expanded list if not present', () => {
      const state = fileSystemReducer(initialState, toggleFolder('/docs'));
      expect(state.expandedFolders).toContain('/docs');
    });

    it('should remove folder from expanded list if already present', () => {
      const stateWithFolder = { ...initialState, expandedFolders: ['/docs'] };
      const state = fileSystemReducer(stateWithFolder, toggleFolder('/docs'));
      expect(state.expandedFolders).not.toContain('/docs');
    });
  });

  describe('openFile', () => {
    it('should add file to open files list', () => {
      const mockFile = createMockFile('/test.md', 'test.md');

      const state = fileSystemReducer(initialState, openFile(mockFile));
      expect(state.openFiles).toHaveLength(1);
      expect(state.openFiles[0]).toEqual(mockFile);
      expect(state.currentFile).toEqual(mockFile);
    });

    it('should not add duplicate files', () => {
      const mockFile = createMockFile('/test.md', 'test.md');

      const state1 = fileSystemReducer(initialState, openFile(mockFile));
      const state2 = fileSystemReducer(state1, openFile(mockFile));
      expect(state2.openFiles).toHaveLength(1);
    });

    it('should update current file', () => {
      const mockFile = createMockFile('/test.md', 'test.md');
      const state = fileSystemReducer(initialState, openFile(mockFile));
      expect(state.currentFile).toEqual(mockFile);
    });
  });

  describe('closeFile', () => {
    it('should remove file from open files list', () => {
      const mockFile1 = createMockFile('/test1.md', 'test1.md');
      const mockFile2 = createMockFile('/test2.md', 'test2.md');

      let state = fileSystemReducer(initialState, openFile(mockFile1));
      state = fileSystemReducer(state, openFile(mockFile2));
      state = fileSystemReducer(state, closeFile('/test1.md'));

      expect(state.openFiles).toHaveLength(1);
      expect(state.openFiles[0].path).toBe('/test2.md');
    });

    it('should update current file when closing current', () => {
      const mockFile1 = createMockFile('/test1.md', 'test1.md');
      const mockFile2 = createMockFile('/test2.md', 'test2.md');

      let state = fileSystemReducer(initialState, openFile(mockFile1));
      state = fileSystemReducer(state, openFile(mockFile2));
      state = fileSystemReducer(state, closeFile('/test2.md'));

      expect(state.currentFile).toEqual(mockFile1);
    });
  });

  describe('clearSearchResults', () => {
    it('should clear search results', () => {
      const stateWithResults = {
        ...initialState,
        searchResults: {
          files: [],
          query: 'test',
          count: 0,
        },
      };

      const state = fileSystemReducer(stateWithResults, clearSearchResults());
      expect(state.searchResults).toBeNull();
    });
  });
});
