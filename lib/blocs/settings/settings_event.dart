part of 'settings_bloc.dart';

abstract class SettingsEvent extends Equatable {
  const SettingsEvent();

  @override
  List<Object?> get props => [];
}

class SettingsLoaded extends SettingsEvent {
  const SettingsLoaded();
}

class ThemeModeChanged extends SettingsEvent {
  final ThemeMode themeMode;

  const ThemeModeChanged(this.themeMode);

  @override
  List<Object?> get props => [themeMode];
}

class FontSizeChanged extends SettingsEvent {
  final double fontSize;

  const FontSizeChanged(this.fontSize);

  @override
  List<Object?> get props => [fontSize];
}

class AutoSaveChanged extends SettingsEvent {
  final bool enabled;
  final int interval;

  const AutoSaveChanged({required this.enabled, this.interval = 30});

  @override
  List<Object?> get props => [enabled, interval];
}

class LanguageChanged extends SettingsEvent {
  final String language;

  const LanguageChanged(this.language);

  @override
  List<Object?> get props => [language];
}

class WordWrapChanged extends SettingsEvent {
  final bool enabled;

  const WordWrapChanged(this.enabled);

  @override
  List<Object?> get props => [enabled];
}

class SettingsReset extends SettingsEvent {
  const SettingsReset();
}
