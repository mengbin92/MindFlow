import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:mindflow_storage/mindflow_storage.dart';

part 'settings_event.dart';
part 'settings_state.dart';

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  final StorageService storageService;

  SettingsBloc({required this.storageService}) : super(const SettingsState()) {
    on<SettingsLoaded>(_onSettingsLoaded);
    on<ThemeModeChanged>(_onThemeModeChanged);
    on<FontSizeChanged>(_onFontSizeChanged);
    on<AutoSaveChanged>(_onAutoSaveChanged);
    on<LanguageChanged>(_onLanguageChanged);
    on<WordWrapChanged>(_onWordWrapChanged);
    on<SettingsReset>(_onSettingsReset);
  }

  Future<void> _onSettingsLoaded(
    SettingsLoaded event,
    Emitter<SettingsState> emit,
  ) async {
    await storageService.initialize();
    final settings = storageService.getSettings();
    emit(SettingsState(settings: settings));
  }

  Future<void> _onThemeModeChanged(
    ThemeModeChanged event,
    Emitter<SettingsState> emit,
  ) async {
    final newSettings = state.settings.copyWith(themeMode: event.themeMode);
    await storageService.saveSettings(newSettings);
    emit(state.copyWith(settings: newSettings));
  }

  Future<void> _onFontSizeChanged(
    FontSizeChanged event,
    Emitter<SettingsState> emit,
  ) async {
    final newSettings = state.settings.copyWith(fontSize: event.fontSize);
    await storageService.saveSettings(newSettings);
    emit(state.copyWith(settings: newSettings));
  }

  Future<void> _onAutoSaveChanged(
    AutoSaveChanged event,
    Emitter<SettingsState> emit,
  ) async {
    final newSettings = state.settings.copyWith(
      autoSave: event.enabled,
      autoSaveInterval: event.interval,
    );
    await storageService.saveSettings(newSettings);
    emit(state.copyWith(settings: newSettings));
  }

  Future<void> _onLanguageChanged(
    LanguageChanged event,
    Emitter<SettingsState> emit,
  ) async {
    final newSettings = state.settings.copyWith(language: event.language);
    await storageService.saveSettings(newSettings);
    emit(state.copyWith(settings: newSettings));
  }

  Future<void> _onWordWrapChanged(
    WordWrapChanged event,
    Emitter<SettingsState> emit,
  ) async {
    final newSettings = state.settings.copyWith(wordWrap: event.enabled);
    await storageService.saveSettings(newSettings);
    emit(state.copyWith(settings: newSettings));
  }

  Future<void> _onSettingsReset(
    SettingsReset event,
    Emitter<SettingsState> emit,
  ) async {
    const defaultSettings = AppSettings();
    await storageService.saveSettings(defaultSettings);
    emit(const SettingsState(settings: defaultSettings));
  }
}
