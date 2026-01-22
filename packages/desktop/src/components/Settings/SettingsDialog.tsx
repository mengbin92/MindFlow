/**
 * @fileoverview 设置对话框组件
 * @description 提供应用配置的 UI 界面
 */

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import {
  updateConfig,
  saveConfig,
  exportConfig,
  importConfig,
  resetConfig,
} from '../../store/configSlice';
import { open } from '@tauri-apps/api/dialog';
import { sendNotification } from '@tauri-apps/api/notification';
import ThemeToggle from './ThemeToggle';
import './SettingsDialog.css';

interface SettingsDialogProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
}

/**
 * 设置对话框组件
 */
export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config.config);
  const isLoading = useSelector((state: RootState) => state.config.isLoading);

  // 本地状态（用于未保存的修改）
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * 当配置更新时同步本地状态
   */
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  /**
   * 更新本地配置
   */
  const handleUpdateConfig = (updates: Partial<typeof config>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  /**
   * 保存配置
   */
  const handleSave = () => {
    dispatch(updateConfig(localConfig));
    dispatch(saveConfig(localConfig) as any);
    setHasChanges(false);
    sendNotification({
      title: '配置已保存',
      body: '您的设置已成功保存',
    });
  };

  /**
   * 取消修改
   */
  const handleCancel = () => {
    setLocalConfig(config);
    setHasChanges(false);
    onClose();
  };

  /**
   * 重置配置
   */
  const handleReset = async () => {
    if (window.confirm('确定要重置所有设置吗？这将恢复默认配置。')) {
      await dispatch(resetConfig() as any);
      setHasChanges(false);
      sendNotification({
        title: '配置已重置',
        body: '所有设置已恢复为默认值',
      });
    }
  };

  /**
   * 导出配置
   */
  const handleExport = async () => {
    try {
      const filePath = await open({
        title: '选择导出位置',
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      });

      if (filePath && typeof filePath === 'string') {
        await dispatch(exportConfig(localConfig) as any);
        sendNotification({
          title: '导出成功',
          body: `配置已导出到 ${filePath}`,
        });
      }
    } catch (error) {
      sendNotification({
        title: '导出失败',
        body: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  /**
   * 导入配置
   */
  const handleImport = async () => {
    try {
      const filePath = await open({
        title: '选择配置文件',
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      });

      if (filePath && typeof filePath === 'string') {
        await dispatch(importConfig(filePath) as any);
        setHasChanges(false);
        sendNotification({
          title: '导入成功',
          body: '配置已成功导入',
        });
      }
    } catch (error) {
      sendNotification({
        title: '导入失败',
        body: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-dialog-overlay" onClick={handleCancel}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="settings-dialog-header">
          <h2 className="settings-dialog-title">设置</h2>
          <button
            className="settings-dialog-close"
            onClick={handleCancel}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="settings-dialog-content">
          {/* 主题设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">外观</h3>
            <ThemeToggle />
          </div>

          {/* 编辑器设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">编辑器</h3>

            <div className="settings-item">
              <label className="settings-item-label">字体大小</label>
              <div className="settings-item-control">
                <input
                  type="number"
                  min="10"
                  max="24"
                  value={localConfig.fontSize}
                  onChange={(e) =>
                    handleUpdateConfig({ fontSize: parseInt(e.target.value) || 14 })
                  }
                  className="settings-input"
                />
                <span className="settings-item-unit">px</span>
              </div>
            </div>

            <div className="settings-item">
              <label className="settings-item-label">字体</label>
              <select
                value={localConfig.fontFamily}
                onChange={(e) => handleUpdateConfig({ fontFamily: e.target.value })}
                className="settings-select"
              >
                <option value="Fira Code">Fira Code</option>
                <option value="Consolas">Consolas</option>
                <option value="Monaco">Monaco</option>
                <option value="'Courier New'">Courier New</option>
                <option value="monospace">系统等宽字体</option>
              </select>
            </div>

            <div className="settings-item">
              <label className="settings-item-label">Tab 宽度</label>
              <div className="settings-item-control">
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={localConfig.tabSize}
                  onChange={(e) =>
                    handleUpdateConfig({ tabSize: parseInt(e.target.value) || 4 })
                  }
                  className="settings-input"
                />
                <span className="settings-item-unit">空格</span>
              </div>
            </div>

            <div className="settings-item">
              <label className="settings-item-label">自动换行</label>
              <button
                className={`settings-toggle ${localConfig.wordWrap ? 'active' : ''}`}
                onClick={() => handleUpdateConfig({ wordWrap: !localConfig.wordWrap })}
              >
                {localConfig.wordWrap ? '开启' : '关闭'}
              </button>
            </div>

            <div className="settings-item">
              <label className="settings-item-label">显示行号</label>
              <button
                className={`settings-toggle ${localConfig.lineNumbers ? 'active' : ''}`}
                onClick={() => handleUpdateConfig({ lineNumbers: !localConfig.lineNumbers })}
              >
                {localConfig.lineNumbers ? '开启' : '关闭'}
              </button>
            </div>
          </div>

          {/* 自动保存设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">自动保存</h3>

            <div className="settings-item">
              <label className="settings-item-label">启用自动保存</label>
              <button
                className={`settings-toggle ${localConfig.autoSave ? 'active' : ''}`}
                onClick={() => handleUpdateConfig({ autoSave: !localConfig.autoSave })}
              >
                {localConfig.autoSave ? '开启' : '关闭'}
              </button>
            </div>

            {localConfig.autoSave && (
              <div className="settings-item">
                <label className="settings-item-label">保存延迟</label>
                <div className="settings-item-control">
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="100"
                    value={localConfig.autoSaveDelay}
                    onChange={(e) =>
                      handleUpdateConfig({
                        autoSaveDelay: parseInt(e.target.value) || 1000,
                      })
                    }
                    className="settings-input"
                  />
                  <span className="settings-item-unit">ms</span>
                </div>
              </div>
            )}
          </div>

          {/* 导入/导出 */}
          <div className="settings-section">
            <h3 className="settings-section-title">配置管理</h3>
            <div className="settings-buttons-row">
              <button
                className="settings-button settings-button-secondary"
                onClick={handleImport}
                disabled={isLoading}
              >
                📥 导入配置
              </button>
              <button
                className="settings-button settings-button-secondary"
                onClick={handleExport}
                disabled={isLoading}
              >
                📤 导出配置
              </button>
            </div>
            <button
              className="settings-button settings-button-danger"
              onClick={handleReset}
              disabled={isLoading}
            >
              🔄 重置为默认
            </button>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="settings-dialog-footer">
          <button
            className="settings-button settings-button-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            className="settings-button settings-button-primary"
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
