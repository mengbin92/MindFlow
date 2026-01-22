/**
 * @fileoverview 配置管理状态管理
 * @description 使用Redux Toolkit管理应用配置状态
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/tauri';
import type { AppConfig } from '@mindflow/types';
import { DEFAULT_CONFIG } from '@mindflow/types';

// ==================== 状态接口 ====================

interface ConfigState {
  /** 当前配置 */
  config: AppConfig;

  /** 是否正在加载 */
  isLoading: boolean;

  /** 错误信息 */
  error: string | null;

  /** 最后保存时间 */
  lastSaved: Date | null;

  /** 是否已初始化 */
  isInitialized: boolean;
}

// ==================== 初始状态 ====================

const getInitialConfig = (): AppConfig => {
  // 尝试从 localStorage 读取配置
  const savedConfig = localStorage.getItem('mindflow-config');
  if (savedConfig) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
    } catch (e) {
      console.error('Failed to parse saved config:', e);
    }
  }
  return { ...DEFAULT_CONFIG };
};

const initialState: ConfigState = {
  config: getInitialConfig(),
  isLoading: false,
  error: null,
  lastSaved: null,
  isInitialized: false,
};

// ==================== 异步 Thunks ====================

/**
 * 保存配置到文件系统
 */
export const saveConfig = createAsyncThunk(
  'config/saveConfig',
  async (config: AppConfig) => {
    try {
      await invoke('save_config', { config });
      // 同时保存到 localStorage 作为备份
      localStorage.setItem('mindflow-config', JSON.stringify(config));
      return config;
    } catch (error) {
      // 如果 Tauri 命令失败（例如在 Web 环境），只保存到 localStorage
      localStorage.setItem('mindflow-config', JSON.stringify(config));
      return config;
    }
  }
);

/**
 * 从文件系统加载配置
 */
export const loadConfig = createAsyncThunk(
  'config/loadConfig',
  async () => {
  try {
    const config = await invoke<AppConfig>('load_config', {});
    // 同步到 localStorage
    localStorage.setItem('mindflow-config', JSON.stringify(config));
    return config;
  } catch (error) {
    // 如果 Tauri 命令失败，从 localStorage 读取
    const savedConfig = localStorage.getItem('mindflow-config');
    if (savedConfig) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
    }
    return { ...DEFAULT_CONFIG };
  }
  }
);

/**
 * 导出配置到文件
 */
export const exportConfig = createAsyncThunk(
  'config/exportConfig',
  async (config: AppConfig) => {
    await invoke('export_config', { config });
    return config;
  }
);

/**
 * 从文件导入配置
 */
export const importConfig = createAsyncThunk(
  'config/importConfig',
  async (filePath: string) => {
    const config = await invoke<AppConfig>('import_config', { filePath });
    localStorage.setItem('mindflow-config', JSON.stringify(config));
    return config;
  }
);

/**
 * 重置配置为默认值
 */
export const resetConfig = createAsyncThunk(
  'config/resetConfig',
  async () => {
    const config = { ...DEFAULT_CONFIG };
    localStorage.setItem('mindflow-config', JSON.stringify(config));
    await invoke('save_config', { config });
    return config;
  }
);

// ==================== Slice ====================

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    /** 更新配置 */
    updateConfig: (state, action: PayloadAction<Partial<AppConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },

    /** 设置主题 */
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.config.theme = action.payload;
    },

    /** 设置字体大小 */
    setFontSize: (state, action: PayloadAction<number>) => {
      state.config.fontSize = action.payload;
    },

    /** 设置字体 */
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.config.fontFamily = action.payload;
    },

    /** 设置 Tab 大小 */
    setTabSize: (state, action: PayloadAction<number>) => {
      state.config.tabSize = action.payload;
    },

    /** 切换自动换行 */
    toggleWordWrap: (state) => {
      state.config.wordWrap = !state.config.wordWrap;
    },

    /** 切换行号显示 */
    toggleLineNumbers: (state) => {
      state.config.lineNumbers = !state.config.lineNumbers;
    },

    /** 切换自动保存 */
    toggleAutoSave: (state) => {
      state.config.autoSave = !state.config.autoSave;
    },

    /** 设置自动保存延迟 */
    setAutoSaveDelay: (state, action: PayloadAction<number>) => {
      state.config.autoSaveDelay = action.payload;
    },

    /** 清除错误 */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // saveConfig
    builder
      .addCase(saveConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
        state.lastSaved = new Date();
      })
      .addCase(saveConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save config';
      });

    // loadConfig
    builder
      .addCase(loadConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
        state.isInitialized = true;
      })
      .addCase(loadConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load config';
        // 使用默认配置
        state.config = { ...DEFAULT_CONFIG };
        state.isInitialized = true;
      });

    // exportConfig
    builder
      .addCase(exportConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportConfig.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(exportConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to export config';
      });

    // importConfig
    builder
      .addCase(importConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
      })
      .addCase(importConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to import config';
      });

    // resetConfig
    builder
      .addCase(resetConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
      })
      .addCase(resetConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to reset config';
      });
  },
});

// ==================== 导出 ====================

export const {
  updateConfig,
  setTheme,
  setFontSize,
  setFontFamily,
  setTabSize,
  toggleWordWrap,
  toggleLineNumbers,
  toggleAutoSave,
  setAutoSaveDelay,
  clearError,
} = configSlice.actions;

export default configSlice.reducer;
