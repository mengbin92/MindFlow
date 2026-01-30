part of 'settings_bloc.dart';

class SettingsState extends Equatable {
  final AppSettings settings;

  const SettingsState({
    this.settings = const AppSettings(),
  });

  SettingsState copyWith({
    AppSettings? settings,
  }) {
    return SettingsState(
      settings: settings ?? this.settings,
    );
  }

  ThemeMode get themeMode => settings.themeMode;
  double get fontSize => settings.fontSize;
  bool get autoSave => settings.autoSave;
  String get language => settings.language;
  bool get wordWrap => settings.wordWrap;

  @override
  List<Object?> get props => [settings];
}
