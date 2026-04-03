import 'package:equatable/equatable.dart';
import 'package:uuid/uuid.dart';

class Document extends Equatable {
  final String id;
  final String title;
  final String content;
  final String? parentId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isFolder;
  final List<String> tags;
  final bool isFavorite;

  const Document({
    required this.id,
    required this.title,
    this.content = '',
    this.parentId,
    required this.createdAt,
    required this.updatedAt,
    this.isFolder = false,
    this.tags = const [],
    this.isFavorite = false,
  });

  factory Document.create({
    String? id,
    required String title,
    String content = '',
    String? parentId,
    bool isFolder = false,
    List<String> tags = const [],
  }) {
    final now = DateTime.now();
    return Document(
      id: id ?? const Uuid().v4(),
      title: title,
      content: content,
      parentId: parentId,
      createdAt: now,
      updatedAt: now,
      isFolder: isFolder,
      tags: tags,
    );
  }

  Document copyWith({
    String? id,
    String? title,
    String? content,
    String? parentId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isFolder,
    List<String>? tags,
    bool? isFavorite,
    bool clearParentId = false,
  }) {
    return Document(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      parentId: clearParentId ? null : (parentId ?? this.parentId),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isFolder: isFolder ?? this.isFolder,
      tags: tags ?? this.tags,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'parentId': parentId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isFolder': isFolder ? 1 : 0,
      'tags': tags.join(','),
      'isFavorite': isFavorite ? 1 : 0,
    };
  }

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      parentId: json['parentId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isFolder: (json['isFolder'] as int) == 1,
      tags: (json['tags'] as String).isEmpty
          ? const []
          : (json['tags'] as String).split(','),
      isFavorite: (json['isFavorite'] as int) == 1,
    );
  }

  String get displayTitle => title.isEmpty ? 'Untitled' : title;

  String get fileExtension => isFolder ? '' : '.md';

  @override
  List<Object?> get props => [
        id,
        title,
        content,
        parentId,
        createdAt,
        updatedAt,
        isFolder,
        tags,
        isFavorite,
      ];
}
