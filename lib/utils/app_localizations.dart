import 'dart:async';
import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'appName': 'MindFlow',
      'newDocument': 'New Document',
      'newFolder': 'New Folder',
      'untitled': 'Untitled',
      'save': 'Save',
      'delete': 'Delete',
      'cancel': 'Cancel',
      'confirm': 'Confirm',
      'edit': 'Edit',
      'preview': 'Preview',
      'settings': 'Settings',
      'favorites': 'Favorites',
      'search': 'Search',
      'noDocuments': 'No documents',
      'createHint': 'Tap + to create a new document',
      'noFavorites': 'No favorites',
      'favoriteHint': 'Long press to add to favorites',
      'unsavedChanges': 'Unsaved changes',
      'savePrompt': 'Do you want to save changes?',
      'discard': 'Don\'t save',
      'theme': 'Theme',
      'light': 'Light',
      'dark': 'Dark',
      'system': 'System',
      'fontSize': 'Font Size',
      'autoSave': 'Auto Save',
      'wordWrap': 'Word Wrap',
      'language': 'Language',
    },
    'zh': {
      'appName': 'MindFlow',
      'newDocument': '新建文档',
      'newFolder': '新建文件夹',
      'untitled': '未命名',
      'save': '保存',
      'delete': '删除',
      'cancel': '取消',
      'confirm': '确认',
      'edit': '编辑',
      'preview': '预览',
      'settings': '设置',
      'favorites': '收藏',
      'search': '搜索',
      'noDocuments': '暂无文档',
      'createHint': '点击 + 创建新文档',
      'noFavorites': '暂无收藏',
      'favoriteHint': '长按添加到收藏',
      'unsavedChanges': '未保存的更改',
      'savePrompt': '是否保存更改？',
      'discard': '不保存',
      'theme': '主题',
      'light': '浅色',
      'dark': '深色',
      'system': '跟随系统',
      'fontSize': '字体大小',
      'autoSave': '自动保存',
      'wordWrap': '自动换行',
      'language': '语言',
    },
  };

  String getString(String key) {
    return _localizedValues[locale.languageCode]?[key] ??
        _localizedValues['en']![key]!;
  }

  String get appName => getString('appName');
  String get newDocument => getString('newDocument');
  String get newFolder => getString('newFolder');
  String get untitled => getString('untitled');
  String get save => getString('save');
  String get delete => getString('delete');
  String get cancel => getString('cancel');
  String get confirm => getString('confirm');
  String get edit => getString('edit');
  String get preview => getString('preview');
  String get settings => getString('settings');
  String get favorites => getString('favorites');
  String get search => getString('search');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'zh'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
