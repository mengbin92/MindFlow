import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

class AppSettings extends Equatable {
  final ThemeMode themeMode;
  final String fontFamily;
  final double fontSize;
  final bool autoSave;
  final int autoSaveInterval;
  final String language;
  final bool showLineNumbers;
  final bool wordWrap;
  final String defaultExportFormat;

  const AppSettings({
    this.themeMode = ThemeMode.system,
    this.fontFamily = 'FiraCode',
    this.fontSize = 16.0,
    this.autoSave = true,
    this.autoSaveInterval = 30,
    this.language = 'zh_CN',
    this.showLineNumbers = false,
    this.wordWrap = true,
    this.defaultExportFormat = 'md',
  });

  AppSettings copyWith({
    ThemeMode? themeMode,
    String? fontFamily,
    double? fontSize,
    bool? autoSave,
    int? autoSaveInterval,
    String? language,
    bool? showLineNumbers,
    bool? wordWrap,
    String? defaultExportFormat,
  }) {
    return AppSettings(
      themeMode: themeMode ?? this.themeMode,
      fontFamily: fontFamily ?? this.fontFamily,
      fontSize: fontSize ?? this.fontSize,
      autoSave: autoSave ?? this.autoSave,
      autoSaveInterval: autoSaveInterval ?? this.autoSaveInterval,
      language: language ?? this.language,
      showLineNumbers: showLineNumbers ?? this.showLineNumbers,
      wordWrap: wordWrap ?? this.wordWrap,
      defaultExportFormat: defaultExportFormat ?? this.defaultExportFormat,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'themeMode': themeMode.index,
      'fontFamily': fontFamily,
      'fontSize': fontSize,
      'autoSave': autoSave,
      'autoSaveInterval': autoSaveInterval,
      'language': language,
      'showLineNumbers': showLineNumbers,
      'wordWrap': wordWrap,
      'defaultExportFormat': defaultExportFormat,
    };
  }

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      themeMode: ThemeMode.values[json['themeMode'] as int? ?? 0],
      fontFamily: json['fontFamily'] as String? ?? 'FiraCode',
      fontSize: json['fontSize'] as double? ?? 16.0,
      autoSave: json['autoSave'] as bool? ?? true,
      autoSaveInterval: json['autoSaveInterval'] as int? ?? 30,
      language: json['language'] as String? ?? 'zh_CN',
      showLineNumbers: json['showLineNumbers'] as bool? ?? false,
      wordWrap: json['wordWrap'] as bool? ?? true,
      defaultExportFormat: json['defaultExportFormat'] as String? ?? 'md',
    );
  }

  @override
  List<Object?> get props => [
        themeMode,
        fontFamily,
        fontSize,
        autoSave,
        autoSaveInterval,
        language,
        showLineNumbers,
        wordWrap,
        defaultExportFormat,
      ];
}
