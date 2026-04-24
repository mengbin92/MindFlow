import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../application/workspace/workspace_service.dart';
import '../../domain/models/workspace_descriptor.dart';
import '../../domain/models/workspace_snapshot.dart';
import '../../domain/repositories/document_repository.dart';
import '../../domain/repositories/workspace_repository.dart';
import '../../models/document.dart';
import 'package:mindflow_storage/mindflow_storage.dart';

part 'file_event.dart';
part 'file_state.dart';

class FileBloc extends Bloc<FileEvent, FileState> {
  final DocumentRepository documentRepository;
  final WorkspaceRepository workspaceRepository;
  final WorkspaceService workspaceService;
  final StorageService storageService;
  Timer? _autoSaveTimer;

  FileBloc({
    required this.documentRepository,
    required this.workspaceRepository,
    required this.workspaceService,
    required this.storageService,
  }) : super(const FileState()) {
    on<FilesLoaded>(_onFilesLoaded);
    on<FileCreated>(_onFileCreated);
    on<FileUpdated>(_onFileUpdated);
    on<FileDeleted>(_onFileDeleted);
    on<FileSelected>(_onFileSelected);
    on<FileOpened>(_onFileOpened);
    on<FileContentChanged>(_onFileContentChanged);
    on<FileSaved>(_onFileSaved);
    on<FileToggledFavorite>(_onFileToggledFavorite);
    on<FilesSearched>(_onFilesSearched);
    on<FolderNavigated>(_onFolderNavigated);
    on<FileMoved>(_onFileMoved);
    on<WorkspacePicked>(_onWorkspacePicked);
    on<LocalLibrarySelected>(_onLocalLibrarySelected);
    on<AutoSaveTriggered>(_onAutoSaveTriggered);
  }

  Future<void> _onFilesLoaded(
    FilesLoaded event,
    Emitter<FileState> emit,
  ) async {
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final restoredDocumentId =
          state.selectedDocument?.id ?? storageService.getLastOpenedFile();
      final snapshot = await workspaceService.load(
        folderId: state.currentFolderId,
        selectedDocumentId: restoredDocumentId,
      );
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: FileStatus.success,
        currentFolderId: state.currentFolderId,
        clearSearchQuery: true,
        clearErrorMessage: true,
      );
    } catch (e) {
      emit(
        state.copyWith(status: FileStatus.failure, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onFileCreated(
    FileCreated event,
    Emitter<FileState> emit,
  ) async {
    try {
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final document = Document.create(
        title: event.title,
        content: event.content,
        parentId: event.parentId ?? state.currentFolderId ?? workspace.rootPath,
        isFolder: event.isFolder,
      );
      await documentRepository.createDocument(document);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFileUpdated(
    FileUpdated event,
    Emitter<FileState> emit,
  ) async {
    try {
      final updated = await documentRepository.updateDocument(event.document);
      if (state.selectedDocument?.id == updated.id) {
        emit(state.copyWith(selectedDocument: updated));
      }
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFileDeleted(
    FileDeleted event,
    Emitter<FileState> emit,
  ) async {
    try {
      await documentRepository.deleteDocument(event.id);
      if (state.selectedDocument?.id == event.id) {
        emit(state.copyWith(clearSelectedDocument: true));
      }
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  void _onFileSelected(FileSelected event, Emitter<FileState> emit) {
    emit(state.copyWith(selectedDocument: event.document));
  }

  Future<void> _onFileOpened(FileOpened event, Emitter<FileState> emit) async {
    final current = state.findDocumentById(event.id);
    if (current != null) {
      await _rememberOpenedDocument(current);
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final snapshot = await workspaceService.load(
        folderId: state.currentFolderId,
        selectedDocumentId: current.id,
      );
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: state.status,
        currentFolderId: state.currentFolderId,
      );
      return;
    }

    try {
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final document = await workspaceService.openDocument(event.id);
      if (document != null && !document.isFolder) {
        await _rememberOpenedDocument(document);
      }
      final snapshot = await workspaceService.load(
        folderId: state.currentFolderId,
        selectedDocumentId: document?.id,
      );
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: state.status,
        currentFolderId: state.currentFolderId,
      );
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  void _onFileContentChanged(
    FileContentChanged event,
    Emitter<FileState> emit,
  ) {
    final currentDoc = state.selectedDocument;
    if (currentDoc != null) {
      final updated = currentDoc.copyWith(content: event.content);
      emit(state.copyWith(selectedDocument: updated, hasUnsavedChanges: true));

      _autoSaveTimer?.cancel();
      _autoSaveTimer = Timer(const Duration(seconds: 2), () {
        add(const AutoSaveTriggered());
      });
    }
  }

  Future<void> _onFileSaved(FileSaved event, Emitter<FileState> emit) async {
    final currentDoc = state.selectedDocument;
    if (currentDoc != null) {
      try {
        await documentRepository.updateDocument(currentDoc);
        emit(state.copyWith(hasUnsavedChanges: false));
      } catch (e) {
        emit(state.copyWith(errorMessage: e.toString()));
      }
    }
  }

  Future<void> _onAutoSaveTriggered(
    AutoSaveTriggered event,
    Emitter<FileState> emit,
  ) async {
    if (state.hasUnsavedChanges && state.selectedDocument != null) {
      add(const FileSaved());
    }
  }

  Future<void> _onFileToggledFavorite(
    FileToggledFavorite event,
    Emitter<FileState> emit,
  ) async {
    try {
      await documentRepository.toggleFavorite(event.id);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFilesSearched(
    FilesSearched event,
    Emitter<FileState> emit,
  ) async {
    if (event.query.isEmpty) {
      add(const FilesLoaded());
      return;
    }
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final snapshot = await workspaceService.search(
        query: event.query,
        folderId: state.currentFolderId,
        selectedDocumentId: state.selectedDocument?.id,
      );
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: FileStatus.success,
        currentFolderId: state.currentFolderId,
        searchQuery: event.query,
      );
    } catch (e) {
      emit(
        state.copyWith(status: FileStatus.failure, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onFolderNavigated(
    FolderNavigated event,
    Emitter<FileState> emit,
  ) async {
    emit(
      state.copyWith(
        currentFolderId: event.folderId,
        status: FileStatus.loading,
        clearSelectedDocument: event.folderId == null,
      ),
    );
    try {
      final workspace = await workspaceRepository.getCurrentWorkspace();
      final snapshot = await workspaceService.load(
        folderId: event.folderId,
        selectedDocumentId: state.selectedDocument?.id,
      );
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: FileStatus.success,
        currentFolderId: event.folderId,
        clearSearchQuery: true,
      );
    } catch (e) {
      emit(
        state.copyWith(status: FileStatus.failure, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onFileMoved(FileMoved event, Emitter<FileState> emit) async {
    try {
      await documentRepository.moveDocument(event.id, event.newParentId);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onWorkspacePicked(
    WorkspacePicked event,
    Emitter<FileState> emit,
  ) async {
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final workspace = await workspaceRepository.pickWorkspace();
      if (workspace == null) {
        emit(state.copyWith(status: FileStatus.success));
        return;
      }
      final snapshot = await workspaceService.load(folderId: null);
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: FileStatus.success,
        clearSelectedDocument: true,
        clearCurrentFolderId: true,
        clearSearchQuery: true,
      );
    } catch (e) {
      emit(state.copyWith(
          status: FileStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> _onLocalLibrarySelected(
    LocalLibrarySelected event,
    Emitter<FileState> emit,
  ) async {
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final workspace = await workspaceRepository.useLocalLibrary();
      final snapshot = await workspaceService.load(folderId: null);
      _emitWorkspaceSnapshot(
        emit,
        snapshot,
        workspace: workspace,
        status: FileStatus.success,
        clearSelectedDocument: true,
        clearCurrentFolderId: true,
        clearSearchQuery: true,
      );
    } catch (e) {
      emit(state.copyWith(
          status: FileStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> _rememberOpenedDocument(Document document) async {
    await storageService.saveLastOpenedFile(document.id);
    await storageService.addRecentFile(document.id);
  }

  void _emitWorkspaceSnapshot(
    Emitter<FileState> emit,
    WorkspaceSnapshot snapshot, {
    required WorkspaceDescriptor workspace,
    required FileStatus status,
    String? searchQuery,
    bool clearSelectedDocument = false,
    bool clearCurrentFolderId = false,
    bool clearSearchQuery = false,
    bool clearErrorMessage = false,
    String? currentFolderId,
  }) {
    emit(
      state.copyWith(
        status: status,
        documents: snapshot.documents,
        allDocuments: snapshot.allDocuments,
        favoriteDocuments: snapshot.favoriteDocuments,
        recentDocuments: snapshot.recentDocuments,
        selectedDocument: snapshot.selectedDocument,
        currentFolder: snapshot.currentFolder,
        folderTrail: snapshot.folderTrail,
        workspaceName: workspace.name,
        workspaceRootPath: workspace.rootPath,
        isExternalWorkspace: workspace.isExternal,
        currentFolderId: currentFolderId,
        searchQuery: searchQuery,
        clearSelectedDocument: clearSelectedDocument,
        clearCurrentFolderId: clearCurrentFolderId,
        clearSearchQuery: clearSearchQuery,
        clearErrorMessage: clearErrorMessage,
      ),
    );
  }

  @override
  Future<void> close() {
    _autoSaveTimer?.cancel();
    return super.close();
  }
}
