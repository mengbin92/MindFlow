part of 'file_bloc.dart';

enum FileStatus { initial, loading, success, failure }

class FileState extends Equatable {
  final FileStatus status;
  final List<Document> documents;
  final List<Document> allDocuments;
  final List<Document> favoriteDocuments;
  final List<Document> recentDocuments;
  final Document? selectedDocument;
  final Document? currentFolder;
  final List<Document> folderTrail;
  final String workspaceName;
  final String? workspaceRootPath;
  final bool isExternalWorkspace;
  final String? currentFolderId;
  final String? searchQuery;
  final bool hasUnsavedChanges;
  final String? errorMessage;

  const FileState({
    this.status = FileStatus.initial,
    this.documents = const [],
    this.allDocuments = const [],
    this.favoriteDocuments = const [],
    this.recentDocuments = const [],
    this.selectedDocument,
    this.currentFolder,
    this.folderTrail = const [],
    this.workspaceName = '本地资料库',
    this.workspaceRootPath,
    this.isExternalWorkspace = false,
    this.currentFolderId,
    this.searchQuery,
    this.hasUnsavedChanges = false,
    this.errorMessage,
  });

  FileState copyWith({
    FileStatus? status,
    List<Document>? documents,
    List<Document>? allDocuments,
    List<Document>? favoriteDocuments,
    List<Document>? recentDocuments,
    Document? selectedDocument,
    Document? currentFolder,
    List<Document>? folderTrail,
    String? workspaceName,
    String? workspaceRootPath,
    bool? isExternalWorkspace,
    String? currentFolderId,
    String? searchQuery,
    bool? hasUnsavedChanges,
    String? errorMessage,
    bool clearSelectedDocument = false,
    bool clearCurrentFolderId = false,
    bool clearSearchQuery = false,
    bool clearErrorMessage = false,
  }) {
    return FileState(
      status: status ?? this.status,
      documents: documents ?? this.documents,
      allDocuments: allDocuments ?? this.allDocuments,
      favoriteDocuments: favoriteDocuments ?? this.favoriteDocuments,
      recentDocuments: recentDocuments ?? this.recentDocuments,
      selectedDocument: clearSelectedDocument
          ? null
          : (selectedDocument ?? this.selectedDocument),
      currentFolder: currentFolder ?? this.currentFolder,
      folderTrail: folderTrail ?? this.folderTrail,
      workspaceName: workspaceName ?? this.workspaceName,
      workspaceRootPath: workspaceRootPath ?? this.workspaceRootPath,
      isExternalWorkspace: isExternalWorkspace ?? this.isExternalWorkspace,
      currentFolderId: clearCurrentFolderId
          ? null
          : (currentFolderId ?? this.currentFolderId),
      searchQuery: clearSearchQuery ? null : (searchQuery ?? this.searchQuery),
      hasUnsavedChanges: hasUnsavedChanges ?? this.hasUnsavedChanges,
      errorMessage:
          clearErrorMessage ? null : (errorMessage ?? this.errorMessage),
    );
  }

  List<Document> get currentFolderDocuments {
    if (searchQuery != null && searchQuery!.isNotEmpty) {
      return documents;
    }
    return documents.where((d) => d.parentId == currentFolderId).toList();
  }

  List<Document> get folders => documents.where((d) => d.isFolder).toList();

  List<Document> get files => documents.where((d) => !d.isFolder).toList();

  Document? findDocumentById(String id) {
    for (final document in allDocuments) {
      if (document.id == id) {
        return document;
      }
    }
    return null;
  }

  @override
  List<Object?> get props => [
        status,
        documents,
        allDocuments,
        favoriteDocuments,
        recentDocuments,
        selectedDocument,
        currentFolder,
        folderTrail,
        workspaceName,
        workspaceRootPath,
        isExternalWorkspace,
        currentFolderId,
        searchQuery,
        hasUnsavedChanges,
        errorMessage,
      ];
}
