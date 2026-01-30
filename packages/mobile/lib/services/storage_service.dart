import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_settings.dart';

class StorageService {
  static const String _settingsKey = 'app_settings';
  static const String _recentFilesKey = 'recent_files';
  static const String _lastOpenedFileKey = 'last_opened_file';

  late SharedPreferences _prefs;

  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // 设置相关
  Future<void> saveSettings(AppSettings settings) async {
    await _prefs.setString(_settingsKey, jsonEncode(settings.toJson()));
  }

  AppSettings getSettings() {
    final jsonString = _prefs.getString(_settingsKey);
    if (jsonString == null) {
      return const AppSettings();
    }
    try {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return AppSettings.fromJson(json);
    } catch (e) {
      return const AppSettings();
    }
  }

  // 最近文件
  Future<void> saveRecentFiles(List<String> fileIds) async {
    await _prefs.setStringList(_recentFilesKey, fileIds);
  }

  List<String> getRecentFiles() {
    return _prefs.getStringList(_recentFilesKey) ?? [];
  }

  Future<void> addRecentFile(String fileId) async {
    final recentFiles = getRecentFiles();
    recentFiles.remove(fileId);
    recentFiles.insert(0, fileId);
    if (recentFiles.length > 20) {
      recentFiles.removeLast();
    }
    await saveRecentFiles(recentFiles);
  }

  // 最后打开的文件
  Future<void> saveLastOpenedFile(String? fileId) async {
    if (fileId == null) {
      await _prefs.remove(_lastOpenedFileKey);
    } else {
      await _prefs.setString(_lastOpenedFileKey, fileId);
    }
  }

  String? getLastOpenedFile() {
    return _prefs.getString(_lastOpenedFileKey);
  }

  // 通用存储
  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  Future<void> clear() async {
    await _prefs.clear();
  }
}
