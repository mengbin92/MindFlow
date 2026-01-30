import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../models/document.dart';

class FileListItem extends StatelessWidget {
  final Document document;
  final VoidCallback onTap;
  final VoidCallback onFavoriteToggle;
  final VoidCallback onDelete;

  const FileListItem({
    super.key,
    required this.document,
    required this.onTap,
    required this.onFavoriteToggle,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Slidable(
      key: ValueKey(document.id),
      endActionPane: ActionPane(
        motion: const ScrollMotion(),
        children: [
          SlidableAction(
            onPressed: (_) => onFavoriteToggle(),
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            icon: document.isFavorite ? Icons.favorite : Icons.favorite_border,
            label: document.isFavorite ? '取消收藏' : '收藏',
          ),
          SlidableAction(
            onPressed: (_) => onDelete(),
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
            icon: Icons.delete,
            label: '删除',
          ),
        ],
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: document.isFolder
                ? const Color.fromRGBO(33, 150, 243, 0.1)
                : const Color.fromRGBO(76, 175, 80, 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            document.isFolder
                ? Icons.folder
                : Icons.description,
            color: document.isFolder
                ? Colors.blue
                : Colors.green,
          ),
        ),
        title: Text(
          document.displayTitle,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Row(
          children: [
            Text(
              _formatDate(document.updatedAt),
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            ),
            if (!document.isFolder) ...[
              const SizedBox(width: 8),
              Text(
                '${document.content.length} 字符',
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).textTheme.bodySmall?.color,
                ),
              ),
            ],
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (document.isFavorite)
              const Icon(
                Icons.favorite,
                color: Colors.orange,
                size: 16,
              ),
            if (document.isFolder)
              const Icon(
                Icons.chevron_right,
                color: Colors.grey,
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        if (diff.inMinutes == 0) {
          return '刚刚';
        }
        return '${diff.inMinutes}分钟前';
      }
      return '${diff.inHours}小时前';
    } else if (diff.inDays == 1) {
      return '昨天';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}天前';
    } else {
      return '${date.month}/${date.day}';
    }
  }
}
