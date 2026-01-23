/**
 * @fileoverview 应用更新状态管理
 * @description 使用Redux Toolkit管理应用更新状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { checkUpdate as tauriCheckUpdate, installUpdate as tauriInstallUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

// ==================== 类型定义 ====================

/**
 * 更新状态
 */
export type UpdateStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'installing' | 'error';

/**
 * 更新信息
 */
export interface UpdateInfo {
  /** 最新版本 */
  version: string;

  /** 更新日期 */
  date: string;

  /** 更新说明 */
  body: string;

  /** 下载链接 */
  downloadUrl: string;
}

// ==================== 状态接口 ====================

interface UpdaterState {
  /** 更新状态 */
  status: UpdateStatus;

  /** 更新信息 */
  updateInfo: UpdateInfo | null;

  /** 是否应该显示更新对话框 */
  shouldShowUpdateDialog: boolean;

  /** 错误信息 */
  error: string | null;

  /** 进度（0-100） */
  progress: number;
}

// ==================== 初始状态 ====================

const initialState: UpdaterState = {
  status: 'idle',
  updateInfo: null,
  shouldShowUpdateDialog: false,
  error: null,
  progress: 0,
};

// ==================== 异步 Thunks ====================

/**
 * 检查更新
 */
export const checkUpdate = createAsyncThunk(
  'updater/check',
  async () => {
    try {
      const result = await tauriCheckUpdate();

      if (result.shouldUpdate && result.manifest) {
        return {
          shouldUpdate: true,
          version: result.manifest.version,
          date: result.manifest.date,
          body: result.manifest.body,
          downloadUrl: '', // Tauri 1.x 不提供 downloadUrl
        };
      }

      return { shouldUpdate: false };
    } catch (error) {
      // 如果检查失败（例如在开发环境），假装没有更新
      console.warn('Update check failed:', error);
      return { shouldUpdate: false };
    }
  }
);

/**
 * 安装更新
 */
export const installUpdate = createAsyncThunk(
  'updater/install',
  async () => {
    try {
      await tauriInstallUpdate();
      // 安装完成后重启应用
      await relaunch();
    } catch (error) {
      throw new Error(`Failed to install update: ${error}`);
    }
  }
);

/**
 * 稍后提醒更新
 */
export const remindLater = createAsyncThunk(
  'updater/remind_later',
  async () => {
    // 可以保存下次检查的时间到本地存储
    return true;
  }
);

// ==================== Slice ====================

const updaterSlice = createSlice({
  name: 'updater',
  initialState,
  reducers: {
    /** 显示更新对话框 */
    showUpdateDialog: (state) => {
      state.shouldShowUpdateDialog = true;
    },

    /** 隐藏更新对话框 */
    hideUpdateDialog: (state) => {
      state.shouldShowUpdateDialog = false;
    },

    /** 设置进度 */
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = Math.min(100, Math.max(0, action.payload));
    },

    /** 清除错误 */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // checkUpdate
    builder
      .addCase(checkUpdate.pending, (state) => {
        state.status = 'checking';
        state.error = null;
      })
      .addCase(checkUpdate.fulfilled, (state, action) => {
        if (action.payload.shouldUpdate) {
          state.status = 'available';
          state.updateInfo = {
            version: action.payload.version!,
            date: action.payload.date!,
            body: action.payload.body!,
            downloadUrl: action.payload.downloadUrl!,
          };
          state.shouldShowUpdateDialog = true;
        } else {
          state.status = 'up-to-date';
          state.shouldShowUpdateDialog = false;
        }
      })
      .addCase(checkUpdate.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to check for updates';
      });

    // installUpdate
    builder
      .addCase(installUpdate.pending, (state) => {
        state.status = 'installing';
        state.error = null;
      })
      .addCase(installUpdate.fulfilled, (state) => {
        state.status = 'idle';
        state.progress = 100;
        state.shouldShowUpdateDialog = false;
      })
      .addCase(installUpdate.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to install update';
      });

    // remindLater
    builder
      .addCase(remindLater.fulfilled, (state) => {
        state.shouldShowUpdateDialog = false;
      });
  },
});

// ==================== 导出 ====================

export const {
  showUpdateDialog,
  hideUpdateDialog,
  setProgress,
  clearError,
} = updaterSlice.actions;

export default updaterSlice.reducer;
