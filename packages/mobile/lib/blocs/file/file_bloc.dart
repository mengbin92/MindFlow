import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../models/document.dart';
import '../../repositories/file_repository.dart';

part 'file_event.dart';
part 'file_state.dart';

class FileBloc extends Bloc<FileEvent, FileState> {
  final FileRepository fileRepository;
  Timer? _autoSaveTimer;

  FileBloc({required this.fileRepository}) : super(const FileState()) {
    on<FilesLoaded>(_onFilesLoaded);
    on<FileCreated>(_onFileCreated);
    on<FileUpdated>(_onFileUpdated);
    on<FileDeleted>(_onFileDeleted);
    on<FileSelected>(_onFileSelected);
    on<FileContentChanged>(_onFileContentChanged);
    on<FileSaved>(_onFileSaved);
    on<FileToggledFavorite>(_onFileToggledFavorite);
    on<FilesSearched>(_onFilesSearched);
    on<FolderNavigated>(_onFolderNavigated);
    on<FileMoved>(_onFileMoved);
    on<AutoSaveTriggered>(_onAutoSaveTriggered);
  }

  Future<void> _onFilesLoaded(FilesLoaded event, Emitter<FileState> emit) async {
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final documents = await fileRepository.getDocumentsByParentId(state.currentFolderId);
      final favorites = await fileRepository.getFavoriteDocuments();
      emit(state.copyWith(
        status: FileStatus.success,
        documents: documents,
        favoriteDocuments: favorites,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: FileStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onFileCreated(FileCreated event, Emitter<FileState> emit) async {
    try {
      final document = Document.create(
        title: event.title,
        content: event.content,
        parentId: event.parentId ?? state.currentFolderId,
        isFolder: event.isFolder,
      );
      await fileRepository.createDocument(document);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFileUpdated(FileUpdated event, Emitter<FileState> emit) async {
    try {
      final updated = await fileRepository.updateDocument(event.document);
      if (state.selectedDocument?.id == updated.id) {
        emit(state.copyWith(selectedDocument: updated));
      }
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFileDeleted(FileDeleted event, Emitter<FileState> emit) async {
    try {
      await fileRepository.deleteDocument(event.id);
      if (state.selectedDocument?.id == event.id) {
        emit(state.copyWith(selectedDocument: null));
      }
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  void _onFileSelected(FileSelected event, Emitter<FileState> emit) {
    emit(state.copyWith(selectedDocument: event.document));
  }

  void _onFileContentChanged(FileContentChanged event, Emitter<FileState> emit) {
    final currentDoc = state.selectedDocument;
    if (currentDoc != null) {
      final updated = currentDoc.copyWith(content: event.content);
      emit(state.copyWith(
        selectedDocument: updated,
        hasUnsavedChanges: true,
      ));

      // 取消之前的定时器
      _autoSaveTimer?.cancel();
      // 设置新的自动保存定时器
      _autoSaveTimer = Timer(const Duration(seconds: 2), () {
        add(const AutoSaveTriggered());
      });
    }
  }

  Future<void> _onFileSaved(FileSaved event, Emitter<FileState> emit) async {
    final currentDoc = state.selectedDocument;
    if (currentDoc != null) {
      try {
        await fileRepository.updateDocument(currentDoc);
        emit(state.copyWith(hasUnsavedChanges: false));
      } catch (e) {
        emit(state.copyWith(errorMessage: e.toString()));
      }
    }
  }

  Future<void> _onAutoSaveTriggered(AutoSaveTriggered event, Emitter<FileState> emit) async {
    if (state.hasUnsavedChanges && state.selectedDocument != null) {
      add(const FileSaved());
    }
  }

  Future<void> _onFileToggledFavorite(FileToggledFavorite event, Emitter<FileState> emit) async {
    try {
      await fileRepository.toggleFavorite(event.id);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onFilesSearched(FilesSearched event, Emitter<FileState> emit) async {
    if (event.query.isEmpty) {
      add(const FilesLoaded());
      return;
    }
    emit(state.copyWith(status: FileStatus.loading));
    try {
      final documents = await fileRepository.searchDocuments(event.query);
      emit(state.copyWith(
        status: FileStatus.success,
        documents: documents,
        searchQuery: event.query,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: FileStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onFolderNavigated(FolderNavigated event, Emitter<FileState> emit) async {
    emit(state.copyWith(
      currentFolderId: event.folderId,
      status: FileStatus.loading,
    ));
    try {
      final documents = await fileRepository.getDocumentsByParentId(event.folderId);
      emit(state.copyWith(
        status: FileStatus.success,
        documents: documents,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: FileStatus.failure,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onFileMoved(FileMoved event, Emitter<FileState> emit) async {
    try {
      await fileRepository.moveDocument(event.id, event.newParentId);
      add(const FilesLoaded());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  @override
  Future<void> close() {
    _autoSaveTimer?.cancel();
    return super.close();
  }
}
