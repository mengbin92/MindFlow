import { describe, it, expect, vi } from 'vitest';
import { ThemeManager, type Theme } from '../themes';

describe('Themes', () => {
  describe('ThemeManager', () => {
    it('should create with default light theme', () => {
      const manager = new ThemeManager();
      expect(manager.getTheme()).toBe('light');
    });

    it('should set dark theme', () => {
      const manager = new ThemeManager();
      manager.setTheme('dark');
      expect(manager.getTheme()).toBe('dark');
    });

    it('should set light theme', () => {
      const manager = new ThemeManager();
      manager.setTheme('dark');
      manager.setTheme('light');
      expect(manager.getTheme()).toBe('light');
    });

    it('should notify listeners when theme changes', () => {
      const manager = new ThemeManager();
      const listener = vi.fn();
      manager.subscribe(listener);
      manager.setTheme('dark');
      expect(listener).toHaveBeenCalledWith('dark');
    });

    it('should unsubscribe listener', () => {
      const manager = new ThemeManager();
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);
      unsubscribe();
      manager.setTheme('dark');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
