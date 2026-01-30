import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/file/file_bloc.dart';

class DocumentSearchBar extends StatelessWidget {
  const DocumentSearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        decoration: InputDecoration(
          hintText: '搜索文档...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: BlocBuilder<FileBloc, FileState>(
            builder: (context, state) {
              if (state.searchQuery?.isNotEmpty == true) {
                return IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    context.read<FileBloc>().add(const FilesLoaded());
                  },
                );
              }
              return const SizedBox.shrink();
            },
          ),
          filled: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
        ),
        onChanged: (value) {
          context.read<FileBloc>().add(FilesSearched(value));
        },
      ),
    );
  }
}

class DocumentSearchDelegate extends SearchDelegate<String?> {
  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () {
            query = '';
          },
        ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, null);
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return const Center(
        child: Text('输入关键词搜索文档'),
      );
    }
    return _buildSearchResults(context);
  }

  Widget _buildSearchResults(BuildContext context) {
    // 触发搜索
    context.read<FileBloc>().add(FilesSearched(query));

    return BlocBuilder<FileBloc, FileState>(
      builder: (context, state) {
        if (state.status == FileStatus.loading) {
          return const Center(child: CircularProgressIndicator());
        }

        final results = state.documents.where((doc) {
          return doc.title.toLowerCase().contains(query.toLowerCase()) ||
              doc.content.toLowerCase().contains(query.toLowerCase());
        }).toList();

        if (results.isEmpty) {
          return const Center(
            child: Text('未找到相关文档'),
          );
        }

        return ListView.builder(
          itemCount: results.length,
          itemBuilder: (context, index) {
            final doc = results[index];
            return ListTile(
              leading: Icon(
                doc.isFolder ? Icons.folder : Icons.description,
                color: doc.isFolder ? Colors.blue : Colors.green,
              ),
              title: Text(doc.displayTitle),
              subtitle: doc.content.isNotEmpty
                  ? Text(
                      doc.content.substring(
                        0,
                        doc.content.length > 50 ? 50 : doc.content.length,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    )
                  : null,
              onTap: () {
                close(context, doc.id);
              },
            );
          },
        );
      },
    );
  }
}
