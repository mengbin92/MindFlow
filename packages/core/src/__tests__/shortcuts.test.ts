import { describe, it, expect, vi } from 'vitest';
import { ShortcutManager, DefaultShortcuts } from '../shortcuts';
import { EditorView } from '@codemirror/view';

describe('Shortcuts', () => {
  describe('DefaultShortcuts', () => {
    it('should have default shortcuts defined', () => {
      expect(DefaultShortcuts.Bold).toBeDefined();
      expect(DefaultShortcuts.Italic).toBeDefined();
      expect(DefaultShortcuts.Code).toBeDefined();
    });
  });

  describe('ShortcutManager', () => {
    it('should create empty manager', () => {
      const manager = new ShortcutManager();
      expect(manager).toBeDefined();
    });

    it('should register a shortcut', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      expect(manager.getAll()).toHaveLength(1);
    });

    it('should throw when registering duplicate shortcut', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      expect(() => {
        manager.register({
          key: 'Ctrl-B',
          description: 'Bold again',
          handler,
        });
      }).toThrow();
    });

    it('should unregister a shortcut', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      manager.unregister('Ctrl-B');
      expect(manager.getAll()).toHaveLength(0);
    });

    it('should get all shortcuts', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      manager.register({
        key: 'Ctrl-I',
        description: 'Italic',
        handler,
      });

      const shortcuts = manager.getAll();
      expect(shortcuts).toHaveLength(2);
    });

    it('should get help information', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      const help = manager.getHelp();
      expect(help).toHaveLength(1);
      expect(help[0]).toEqual({ key: 'Ctrl-B', description: 'Bold' });
    });

    it('should generate keymap', () => {
      const manager = new ShortcutManager();
      const handler = vi.fn(() => true);

      manager.register({
        key: 'Ctrl-B',
        description: 'Bold',
        handler,
      });

      const keymap = manager.toKeymap();
      expect(keymap).toHaveLength(1);
      expect(keymap[0].key).toBe('Ctrl-B');
    });
  });
});
