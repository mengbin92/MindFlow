/**
 * @fileoverview 窗口管理状态管理
 * @description 使用Redux Toolkit管理窗口状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/tauri';

// ==================== 类型定义 ====================

/**
 * 窗口状态
 */
export interface WindowState {
  /** 窗口位置 X */
  x: number;

  /** 窗口位置 Y */
  y: number;

  /** 窗口宽度 */
  width: number;

  /** 窗口高度 */
  height: number;

  /** 是否最大化 */
  isMaximized: boolean;

  /** 是否全屏 */
  isFullscreen: boolean;

  /** 是否最小化 */
  isMinimized: boolean;

  /** 窗口标题 */
  title: string;
}

// ==================== 状态接口 ====================

interface WindowManagerState {
  /** 窗口状态 */
  windowState: WindowState;

  /** 是否正在加载 */
  isLoading: boolean;

  /** 错误信息 */
  error: string | null;
}

// ==================== 初始状态 ====================

const initialState: WindowManagerState = {
  windowState: {
    x: 100,
    y: 100,
    width: 1280,
    height: 800,
    isMaximized: false,
    isFullscreen: false,
    isMinimized: false,
    title: 'MindFlow',
  },
  isLoading: false,
  error: null,
};

// ==================== 异步 Thunks ====================

/**
 * 最小化窗口
 */
export const minimizeWindow = createAsyncThunk(
  'window/minimize',
  async () => {
    await invoke('minimize_window');
  }
);

/**
 * 最大化/还原窗口
 */
export const toggleMaximizeWindow = createAsyncThunk(
  'window/toggle_maximize',
  async () => {
    const isMaximized = await invoke<boolean>('toggle_maximize_window');
    return isMaximized;
  }
);

/**
 * 关闭窗口
 */
export const closeWindow = createAsyncThunk(
  'window/close',
  async () => {
    await invoke('close_window');
  }
);

/**
 * 显示窗口
 */
export const showWindow = createAsyncThunk(
  'window/show',
  async () => {
    await invoke('show_window');
  }
);

/**
 * 隐藏窗口
 */
export const hideWindow = createAsyncThunk(
  'window/hide',
  async () => {
    await invoke('hide_window');
  }
);

/**
 * 设置窗口标题
 */
export const setWindowTitle = createAsyncThunk(
  'window/set_title',
  async (title: string) => {
    await invoke('set_window_title', { title });
    return title;
  }
);

/**
 * 全屏/还原窗口
 */
export const toggleFullscreen = createAsyncThunk(
  'window/toggle_fullscreen',
  async () => {
    const isFullscreen = await invoke<boolean>('toggle_fullscreen');
    return isFullscreen;
  }
);

/**
 * 保存当前窗口状态
 */
export const saveCurrentWindowState = createAsyncThunk(
  'window/save_state',
  async () => {
    const state = await invoke<WindowState>('save_current_window_state');
    return state;
  }
);

/**
 * 恢复窗口状态
 */
export const restoreWindowState = createAsyncThunk(
  'window/restore_state',
  async () => {
    const state = await invoke<WindowState>('restore_window_state');
    return state;
  }
);

/**
 * 获取窗口状态
 */
export const getWindowState = createAsyncThunk(
  'window/get_state',
  async () => {
    const state = await invoke<WindowState>('get_window_state');
    return state;
  }
);

// ==================== Slice ====================

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    /** 更新窗口状态 */
    updateWindowState: (state, action: PayloadAction<Partial<WindowState>>) => {
      state.windowState = { ...state.windowState, ...action.payload };
    },

    /** 设置窗口标题 */
    setTitle: (state, action: PayloadAction<string>) => {
      state.windowState.title = action.payload;
    },

    /** 清除错误 */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // toggleMaximizeWindow
    builder
      .addCase(toggleMaximizeWindow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleMaximizeWindow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.windowState.isMaximized = action.payload;
      })
      .addCase(toggleMaximizeWindow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to toggle maximize';
      });

    // toggleFullscreen
    builder
      .addCase(toggleFullscreen.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleFullscreen.fulfilled, (state, action) => {
        state.isLoading = false;
        state.windowState.isFullscreen = action.payload;
      })
      .addCase(toggleFullscreen.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to toggle fullscreen';
      });

    // setWindowTitle
    builder
      .addCase(setWindowTitle.fulfilled, (state, action) => {
        state.windowState.title = action.payload;
      });

    // saveCurrentWindowState
    builder
      .addCase(saveCurrentWindowState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveCurrentWindowState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.windowState = action.payload;
      })
      .addCase(saveCurrentWindowState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save window state';
      });

    // restoreWindowState
    builder
      .addCase(restoreWindowState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreWindowState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.windowState = action.payload;
      })
      .addCase(restoreWindowState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to restore window state';
      });

    // getWindowState
    builder
      .addCase(getWindowState.fulfilled, (state, action) => {
        state.windowState = action.payload;
      });
  },
});

// ==================== 导出 ====================

export const {
  updateWindowState,
  setTitle,
  clearError,
} = windowSlice.actions;

export default windowSlice.reducer;
