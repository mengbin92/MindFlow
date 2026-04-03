import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'application/workspace/workspace_service.dart';
import 'app/app.dart';
import 'app/app_bloc_observer.dart';
import 'blocs/file/file_bloc.dart';
import 'blocs/settings/settings_bloc.dart';
import 'domain/repositories/document_repository.dart';
import 'domain/repositories/workspace_repository.dart';
import 'repositories/file_repository.dart';
import 'services/storage_service.dart';
import 'services/hive_init.dart'
    if (dart.library.html) 'services/hive_init_web.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Bloc.observer = const AppBlocObserver();

  await initHive();
  final storageService = StorageService();
  await storageService.initialize();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(MindFlowApp(storageService: storageService));
}

class MindFlowApp extends StatelessWidget {
  final StorageService storageService;

  const MindFlowApp({super.key, required this.storageService});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider(create: (context) => storageService),
        RepositoryProvider(
          create: (context) =>
              FileRepository(storageService: context.read<StorageService>()),
        ),
        RepositoryProvider<DocumentRepository>(
          create: (context) => context.read<FileRepository>(),
        ),
        RepositoryProvider<WorkspaceRepository>(
          create: (context) => context.read<FileRepository>(),
        ),
        RepositoryProvider(
          create: (context) => WorkspaceService(
            documentRepository: context.read<DocumentRepository>(),
          ),
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) =>
                SettingsBloc(storageService: context.read<StorageService>())
                  ..add(const SettingsLoaded()),
          ),
          BlocProvider(
            create: (context) => FileBloc(
              documentRepository: context.read<DocumentRepository>(),
              workspaceRepository: context.read<WorkspaceRepository>(),
              workspaceService: context.read<WorkspaceService>(),
              storageService: context.read<StorageService>(),
            )..add(const FilesLoaded()),
          ),
        ],
        child: const MindFlowAppView(),
      ),
    );
  }
}
