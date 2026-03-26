part of 'file_bloc.dart';

abstract class FileEvent extends Equatable {
  const FileEvent();

  @override
  List<Object?> get props => [];
}

class FilesLoaded extends FileEvent {
  const FilesLoaded();
}

class FileCreated extends FileEvent {
  final String title;
  final String content;
  final String? parentId;
  final bool isFolder;

  const FileCreated({
    required this.title,
    this.content = '',
    this.parentId,
    this.isFolder = false,
  });

  @override
  List<Object?> get props => [title, content, parentId, isFolder];
}

class FileUpdated extends FileEvent {
  final Document document;

  const FileUpdated(this.document);

  @override
  List<Object?> get props => [document];
}

class FileDeleted extends FileEvent {
  final String id;

  const FileDeleted(this.id);

  @override
  List<Object?> get props => [id];
}

class FileSelected extends FileEvent {
  final Document? document;

  const FileSelected(this.document);

  @override
  List<Object?> get props => [document];
}

class FileOpened extends FileEvent {
  final String id;

  const FileOpened(this.id);

  @override
  List<Object?> get props => [id];
}

class FileContentChanged extends FileEvent {
  final String content;

  const FileContentChanged(this.content);

  @override
  List<Object?> get props => [content];
}

class FileSaved extends FileEvent {
  const FileSaved();
}

class AutoSaveTriggered extends FileEvent {
  const AutoSaveTriggered();
}

class FileToggledFavorite extends FileEvent {
  final String id;

  const FileToggledFavorite(this.id);

  @override
  List<Object?> get props => [id];
}

class FilesSearched extends FileEvent {
  final String query;

  const FilesSearched(this.query);

  @override
  List<Object?> get props => [query];
}

class FolderNavigated extends FileEvent {
  final String? folderId;

  const FolderNavigated(this.folderId);

  @override
  List<Object?> get props => [folderId];
}

class FileMoved extends FileEvent {
  final String id;
  final String? newParentId;

  const FileMoved({required this.id, this.newParentId});

  @override
  List<Object?> get props => [id, newParentId];
}

class WorkspacePicked extends FileEvent {
  const WorkspacePicked();
}

class LocalLibrarySelected extends FileEvent {
  const LocalLibrarySelected();
}
