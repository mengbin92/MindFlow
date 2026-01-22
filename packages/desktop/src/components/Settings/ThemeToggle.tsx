/**
 * @fileoverview 主题切换组件
 * @description 提供主题切换功能（浅色/深色/自动）
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setTheme, saveConfig } from '../../store/configSlice';
import './ThemeToggle.css';

interface ThemeToggleProps {
  /** 是否显示为图标按钮 */
  iconOnly?: boolean;
}

/**
 * 主题切换组件
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ iconOnly = false }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.config.config.theme);

  /**
   * 应用主题到 DOM
   */
  useEffect(() => {
    const root = document.documentElement;

    // 移除所有主题类
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    let themeToApply = theme;

    // 如果是 auto 模式，检测系统主题
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    // 添加对应的主题类
    root.classList.add(`theme-${themeToApply}`);

    // 保存到 localStorage
    localStorage.setItem('mindflow-theme', theme);

    // 监听系统主题变化
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(`theme-${e.matches ? 'dark' : 'light'}`);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  /**
   * 处理主题切换
   */
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    dispatch(setTheme(newTheme));
    // 保存配置
    const state = useSelector((s: RootState) => s.config.config);
    dispatch(saveConfig({ ...state, theme: newTheme }) as any);
  };

  /**
   * 循环切换主题
   */
  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    handleThemeChange(nextTheme);
  };

  /**
   * 获取主题图标
   */
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🔄';
      default:
        return '☀️';
    }
  };

  /**
   * 获取主题标签
   */
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'auto':
        return '自动';
      default:
        return '浅色';
    }
  };

  if (iconOnly) {
    return (
      <button
        className="theme-toggle-icon"
        onClick={cycleTheme}
        title={`当前主题: ${getThemeLabel()} (点击切换)`}
        aria-label="切换主题"
      >
        <span className="theme-icon">{getThemeIcon()}</span>
      </button>
    );
  }

  return (
    <div className="theme-toggle">
      <div className="theme-toggle-label">主题</div>
      <div className="theme-toggle-buttons">
        <button
          className={`theme-button ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="浅色主题"
          aria-label="浅色主题"
        >
          <span className="theme-icon">☀️</span>
          <span className="theme-text">浅色</span>
        </button>
        <button
          className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="深色主题"
          aria-label="深色主题"
        >
          <span className="theme-icon">🌙</span>
          <span className="theme-text">深色</span>
        </button>
        <button
          className={`theme-button ${theme === 'auto' ? 'active' : ''}`}
          onClick={() => handleThemeChange('auto')}
          title="自动主题（跟随系统）"
          aria-label="自动主题"
        >
          <span className="theme-icon">🔄</span>
          <span className="theme-text">自动</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
