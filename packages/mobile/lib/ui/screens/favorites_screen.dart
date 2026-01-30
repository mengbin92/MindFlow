import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/file/file_bloc.dart';
import '../widgets/file_list_item.dart';
import 'editor_screen.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('收藏'),
        centerTitle: true,
      ),
      body: BlocBuilder<FileBloc, FileState>(
        builder: (context, state) {
          if (state.status == FileStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          final favorites = state.favoriteDocuments;

          if (favorites.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite_border,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    '暂无收藏',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '长按文档可以添加到收藏',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: favorites.length,
            itemBuilder: (context, index) {
              final document = favorites[index];
              return FileListItem(
                document: document,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EditorScreen(document: document),
                    ),
                  );
                },
                onFavoriteToggle: () {
                  context.read<FileBloc>().add(
                        FileToggledFavorite(document.id),
                      );
                },
                onDelete: () {
                  _showDeleteConfirm(context, document.id);
                },
              );
            },
          );
        },
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: const Text('确定要删除此文档吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              context.read<FileBloc>().add(FileDeleted(id));
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}
