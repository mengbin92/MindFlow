import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/settings/settings_bloc.dart';

class SettingsScreen extends StatelessWidget {
  final bool embedded;

  const SettingsScreen({super.key, this.embedded = false});

  @override
  Widget build(BuildContext context) {
    final content = BlocBuilder<SettingsBloc, SettingsState>(
      builder: (context, state) {
        return ListView(
          children: [
            if (embedded)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  '设置',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
            // 外观设置
            _buildSectionHeader(context, '外观'),
            ListTile(
              leading: const Icon(Icons.dark_mode),
              title: const Text('主题模式'),
              subtitle: Text(_getThemeModeText(state.themeMode)),
              trailing: DropdownButton<ThemeMode>(
                value: state.themeMode,
                underline: const SizedBox(),
                items: ThemeMode.values.map((mode) {
                  return DropdownMenuItem(
                    value: mode,
                    child: Text(_getThemeModeText(mode)),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    context.read<SettingsBloc>().add(ThemeModeChanged(value));
                  }
                },
              ),
            ),
            ListTile(
              leading: const Icon(Icons.text_fields),
              title: const Text('字体大小'),
              subtitle: Text('${state.fontSize.toInt()}'),
              trailing: SizedBox(
                width: 200,
                child: Slider(
                  value: state.fontSize,
                  min: 12,
                  max: 24,
                  divisions: 12,
                  label: state.fontSize.toInt().toString(),
                  onChanged: (value) {
                    context.read<SettingsBloc>().add(FontSizeChanged(value));
                  },
                ),
              ),
            ),

            // 编辑器设置
            _buildSectionHeader(context, '编辑器'),
            SwitchListTile(
              secondary: const Icon(Icons.save),
              title: const Text('自动保存'),
              subtitle: Text('每 ${state.settings.autoSaveInterval} 秒自动保存'),
              value: state.autoSave,
              onChanged: (value) {
                context.read<SettingsBloc>().add(
                      AutoSaveChanged(
                        enabled: value,
                        interval: state.settings.autoSaveInterval,
                      ),
                    );
              },
            ),
            ListTile(
              leading: const Icon(Icons.timer),
              title: const Text('自动保存间隔'),
              enabled: state.autoSave,
              trailing: DropdownButton<int>(
                value: state.settings.autoSaveInterval,
                underline: const SizedBox(),
                items: [10, 30, 60, 120].map((interval) {
                  return DropdownMenuItem(
                    value: interval,
                    child: Text('$interval 秒'),
                  );
                }).toList(),
                onChanged: state.autoSave
                    ? (value) {
                        if (value != null) {
                          context.read<SettingsBloc>().add(
                                AutoSaveChanged(
                                  enabled: state.autoSave,
                                  interval: value,
                                ),
                              );
                        }
                      }
                    : null,
              ),
            ),
            SwitchListTile(
              secondary: const Icon(Icons.wrap_text),
              title: const Text('自动换行'),
              value: state.wordWrap,
              onChanged: (value) {
                context.read<SettingsBloc>().add(WordWrapChanged(value));
              },
            ),

            // 语言设置
            _buildSectionHeader(context, '语言'),
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text('应用语言'),
              trailing: DropdownButton<String>(
                value: state.language,
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(value: 'zh_CN', child: Text('简体中文')),
                  DropdownMenuItem(value: 'en_US', child: Text('English')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    context.read<SettingsBloc>().add(LanguageChanged(value));
                  }
                },
              ),
            ),

            // 关于
            _buildSectionHeader(context, '关于'),
            const ListTile(
              leading: Icon(Icons.info),
              title: Text('版本'),
              trailing: Text('1.0.0'),
            ),
            ListTile(
              leading: const Icon(Icons.restore),
              title: const Text('恢复默认设置'),
              onTap: () {
                _showResetConfirm(context);
              },
            ),
          ],
        );
      },
    );

    if (embedded) {
      return content;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('设置'), centerTitle: true),
      body: content,
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  String _getThemeModeText(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return '跟随系统';
      case ThemeMode.light:
        return '浅色';
      case ThemeMode.dark:
        return '深色';
    }
  }

  void _showResetConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('恢复默认设置'),
        content: const Text('确定要恢复所有设置到默认值吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              context.read<SettingsBloc>().add(const SettingsReset());
              Navigator.pop(context);
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(const SnackBar(content: Text('已恢复默认设置')));
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
