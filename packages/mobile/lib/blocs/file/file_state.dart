part of 'file_bloc.dart';

enum FileStatus { initial, loading, success, failure }

class FileState extends Equatable {
  final FileStatus status;
  final List<Document> documents;
  final List<Document> favoriteDocuments;
  final Document? selectedDocument;
  final String? currentFolderId;
  final String? searchQuery;
  final bool hasUnsavedChanges;
  final String? errorMessage;

  const FileState({
    this.status = FileStatus.initial,
    this.documents = const [],
    this.favoriteDocuments = const [],
    this.selectedDocument,
    this.currentFolderId,
    this.searchQuery,
    this.hasUnsavedChanges = false,
    this.errorMessage,
  });

  FileState copyWith({
    FileStatus? status,
    List<Document>? documents,
    List<Document>? favoriteDocuments,
    Document? selectedDocument,
    String? currentFolderId,
    String? searchQuery,
    bool? hasUnsavedChanges,
    String? errorMessage,
    bool clearSelectedDocument = false,
    bool clearSearchQuery = false,
    bool clearErrorMessage = false,
  }) {
    return FileState(
      status: status ?? this.status,
      documents: documents ?? this.documents,
      favoriteDocuments: favoriteDocuments ?? this.favoriteDocuments,
      selectedDocument: clearSelectedDocument
          ? null
          : (selectedDocument ?? this.selectedDocument),
      currentFolderId: currentFolderId ?? this.currentFolderId,
      searchQuery: clearSearchQuery ? null : (searchQuery ?? this.searchQuery),
      hasUnsavedChanges: hasUnsavedChanges ?? this.hasUnsavedChanges,
      errorMessage: clearErrorMessage
          ? null
          : (errorMessage ?? this.errorMessage),
    );
  }

  List<Document> get currentFolderDocuments {
    if (searchQuery != null && searchQuery!.isNotEmpty) {
      return documents;
    }
    return documents.where((d) => d.parentId == currentFolderId).toList();
  }

  List<Document> get folders =>
      documents.where((d) => d.isFolder).toList();

  List<Document> get files =>
      documents.where((d) => !d.isFolder).toList();

  @override
  List<Object?> get props => [
        status,
        documents,
        favoriteDocuments,
        selectedDocument,
        currentFolderId,
        searchQuery,
        hasUnsavedChanges,
        errorMessage,
      ];
}
