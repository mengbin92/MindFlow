import 'dart:async';
import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import '../models/document.dart';
import '../services/storage_service.dart';

class FileRepository {
  final StorageService storageService;
  Database? _database;

  FileRepository({required this.storageService});

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final dbFile = path.join(dbPath, 'mindflow.db');

    return await openDatabase(
      dbFile,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            parentId TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isFolder INTEGER NOT NULL DEFAULT 0,
            tags TEXT NOT NULL DEFAULT '',
            isFavorite INTEGER NOT NULL DEFAULT 0
          )
        ''');

        await db.execute('''
          CREATE INDEX idx_parentId ON documents(parentId)
        ''');

        await db.execute('''
          CREATE INDEX idx_isFavorite ON documents(isFavorite)
        ''');

        // 创建默认文件夹
        final now = DateTime.now().toIso8601String();
        await db.execute('''
          INSERT INTO documents (id, title, content, parentId, createdAt, updatedAt, isFolder, tags, isFavorite)
          VALUES ('root', 'My Documents', '', NULL, '$now', '$now', 1, '', 0)
        ''');
      },
    );
  }

  // 获取所有文档
  Future<List<Document>> getAllDocuments() async {
    final db = await database;
    final maps = await db.query('documents', orderBy: 'updatedAt DESC');
    return maps.map((map) => Document.fromJson(map)).toList();
  }

  // 获取文件夹下的文档
  Future<List<Document>> getDocumentsByParentId(String? parentId) async {
    final db = await database;
    final maps = await db.query(
      'documents',
      where: parentId == null ? 'parentId IS NULL' : 'parentId = ?',
      whereArgs: parentId == null ? [] : [parentId],
      orderBy: 'isFolder DESC, updatedAt DESC',
    );
    return maps.map((map) => Document.fromJson(map)).toList();
  }

  // 获取收藏的文档
  Future<List<Document>> getFavoriteDocuments() async {
    final db = await database;
    final maps = await db.query(
      'documents',
      where: 'isFavorite = ? AND isFolder = ?',
      whereArgs: [1, 0],
      orderBy: 'updatedAt DESC',
    );
    return maps.map((map) => Document.fromJson(map)).toList();
  }

  // 获取单个文档
  Future<Document?> getDocument(String id) async {
    final db = await database;
    final maps = await db.query(
      'documents',
      where: 'id = ?',
      whereArgs: [id],
    );
    if (maps.isEmpty) return null;
    return Document.fromJson(maps.first);
  }

  // 创建文档
  Future<Document> createDocument(Document document) async {
    final db = await database;
    await db.insert('documents', document.toJson());
    if (!document.isFolder) {
      await storageService.addRecentFile(document.id);
    }
    return document;
  }

  // 更新文档
  Future<Document> updateDocument(Document document) async {
    final db = await database;
    final updated = document.copyWith(updatedAt: DateTime.now());
    await db.update(
      'documents',
      updated.toJson(),
      where: 'id = ?',
      whereArgs: [document.id],
    );
    return updated;
  }

  // 删除文档
  Future<void> deleteDocument(String id) async {
    final db = await database;
    // 先递归删除子文档
    final children = await getDocumentsByParentId(id);
    for (final child in children) {
      await deleteDocument(child.id);
    }
    await db.delete('documents', where: 'id = ?', whereArgs: [id]);
  }

  // 搜索文档
  Future<List<Document>> searchDocuments(String query) async {
    final db = await database;
    final maps = await db.query(
      'documents',
      where: 'title LIKE ? OR content LIKE ?',
      whereArgs: ['%$query%', '%$query%'],
      orderBy: 'updatedAt DESC',
    );
    return maps.map((map) => Document.fromJson(map)).toList();
  }

  // 切换收藏状态
  Future<Document> toggleFavorite(String id) async {
    final document = await getDocument(id);
    if (document == null) throw Exception('Document not found');
    final updated = document.copyWith(isFavorite: !document.isFavorite);
    return await updateDocument(updated);
  }

  // 移动文档
  Future<Document> moveDocument(String id, String? newParentId) async {
    final document = await getDocument(id);
    if (document == null) throw Exception('Document not found');
    final updated = document.copyWith(
      parentId: newParentId,
      clearParentId: newParentId == null,
    );
    return await updateDocument(updated);
  }

  // 导出为 Markdown 文件
  Future<String> exportToMarkdown(String id) async {
    final document = await getDocument(id);
    if (document == null) throw Exception('Document not found');

    final directory = await getApplicationDocumentsDirectory();
    final fileName = '${document.title.replaceAll(RegExp(r'[^\w\s-]'), '_')}.md';
    final filePath = path.join(directory.path, 'exports', fileName);

    // 确保目录存在
    await Directory(path.dirname(filePath)).create(recursive: true);

    final file = File(filePath);
    await file.writeAsString(document.content);

    return filePath;
  }

  // 关闭数据库
  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
}
