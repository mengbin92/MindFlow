/**
 * @fileoverview 输入对话框组件
 * @description 用于获取用户输入的模态对话框
 * @module packages/desktop/components/InputDialog
 * @author MindFlow Team
 * @license MIT
 */

import React, { useState, useEffect, useRef } from 'react';
import './InputDialog.css';

/**
 * 输入对话框属性
 */
interface InputDialogProps {
  /** 对话框标题 */
  title: string;
  /** 提示信息 */
  message: string;
  /** 默认值 */
  defaultValue?: string;
  /** 确认回调 */
  onConfirm: (value: string) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 占位符 */
  placeholder?: string;
}

/**
 * 输入对话框组件
 */
export const InputDialog: React.FC<InputDialogProps> = ({
  title,
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
  placeholder = '请输入...',
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦输入框
    inputRef.current?.focus();
    // 选中所有文本
    inputRef.current?.select();
  }, []);

  /**
   * 处理确认
   */
  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="input-dialog-overlay" onClick={onCancel}>
      <div className="input-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="input-dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="input-dialog-body">
          <p className="input-dialog-message">{message}</p>
          <input
            ref={inputRef}
            type="text"
            className="input-dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        </div>
        <div className="input-dialog-footer">
          <button
            className="input-dialog-button input-dialog-button-secondary"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="input-dialog-button input-dialog-button-primary"
            onClick={handleConfirm}
            disabled={!value.trim()}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
