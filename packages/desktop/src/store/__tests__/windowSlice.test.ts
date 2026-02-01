import { describe, it, expect, vi, beforeEach } from 'vitest';
import windowReducer, {
  updateWindowState,
  setTitle,
  clearError,
  toggleMaximizeWindow,
  toggleFullscreen,
  setWindowTitle,
  saveCurrentWindowState,
  restoreWindowState,
} from '../windowSlice';
import type { WindowState } from '../windowSlice';
import type { AnyAction } from '@reduxjs/toolkit';

describe('Window Slice', () => {
  const initialWindowState: WindowState = {
    x: 100,
    y: 100,
    width: 1280,
    height: 800,
    isMaximized: false,
    isFullscreen: false,
    isMinimized: false,
    title: 'MindFlow',
  };

  const createState = (windowState: Partial<WindowState> = {}, isLoading = false, error: string | null = null) => ({
    windowState: { ...initialWindowState, ...windowState },
    isLoading,
    error,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const state = windowReducer(undefined, { type: 'unknown' } as AnyAction);
    expect(state.windowState.width).toBe(1280);
    expect(state.windowState.height).toBe(800);
    expect(state.windowState.title).toBe('MindFlow');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should update window state', () => {
    const state = windowReducer(
      createState(),
      updateWindowState({ width: 1600, height: 900 })
    );
    expect(state.windowState.width).toBe(1600);
    expect(state.windowState.height).toBe(900);
    expect(state.windowState.x).toBe(100); // unchanged
  });

  it('should set window title', () => {
    const state = windowReducer(
      createState(),
      setTitle('My Document.md - MindFlow')
    );
    expect(state.windowState.title).toBe('My Document.md - MindFlow');
  });

  it('should clear error', () => {
    const stateWithError = createState({}, false, 'Some error');
    const state = windowReducer(stateWithError, clearError());
    expect(state.error).toBeNull();
  });

  describe('async actions', () => {
    it('should handle toggleMaximizeWindow pending', () => {
      const state = windowReducer(
        createState(),
        toggleMaximizeWindow.pending('', undefined)
      );
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle toggleMaximizeWindow fulfilled', () => {
      const state = windowReducer(
        createState({ isLoading: true }),
        toggleMaximizeWindow.fulfilled(true, '', undefined)
      );
      expect(state.isLoading).toBe(false);
      expect(state.windowState.isMaximized).toBe(true);
    });

    it('should handle toggleMaximizeWindow rejected', () => {
      const state = windowReducer(
        createState({ isLoading: true }),
        toggleMaximizeWindow.rejected(new Error('Failed'), '', undefined)
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed');
    });

    it('should handle toggleFullscreen fulfilled', () => {
      const state = windowReducer(
        createState(),
        toggleFullscreen.fulfilled(true, '', undefined)
      );
      expect(state.windowState.isFullscreen).toBe(true);
    });

    it('should handle setWindowTitle fulfilled', () => {
      const state = windowReducer(
        createState(),
        setWindowTitle.fulfilled('New Title', '', 'New Title')
      );
      expect(state.windowState.title).toBe('New Title');
    });

    it('should handle saveCurrentWindowState fulfilled', () => {
      const newState: WindowState = {
        x: 200,
        y: 150,
        width: 1920,
        height: 1080,
        isMaximized: true,
        isFullscreen: false,
        isMinimized: false,
        title: 'Saved State',
      };
      const state = windowReducer(
        createState({ isLoading: true }),
        saveCurrentWindowState.fulfilled(newState, '', undefined)
      );
      expect(state.isLoading).toBe(false);
      expect(state.windowState).toEqual(newState);
    });

    it('should handle restoreWindowState fulfilled', () => {
      const restoredState: WindowState = {
        x: 50,
        y: 50,
        width: 1024,
        height: 768,
        isMaximized: false,
        isFullscreen: false,
        isMinimized: false,
        title: 'Restored',
      };
      const state = windowReducer(
        createState({ isLoading: true }),
        restoreWindowState.fulfilled(restoredState, '', undefined)
      );
      expect(state.isLoading).toBe(false);
      expect(state.windowState).toEqual(restoredState);
    });
  });
});
