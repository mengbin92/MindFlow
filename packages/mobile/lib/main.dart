import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'blocs/file/file_bloc.dart';
import 'blocs/settings/settings_bloc.dart';
import 'repositories/file_repository.dart';
import 'services/storage_service.dart';
import 'ui/themes/app_theme.dart';
import 'ui/screens/home_screen.dart';
import 'utils/app_localizations.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

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

  runApp(const MindFlowApp());
}

class MindFlowApp extends StatelessWidget {
  const MindFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider(
          create: (context) => StorageService(),
        ),
        RepositoryProvider(
          create: (context) => FileRepository(
            storageService: context.read<StorageService>(),
          ),
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) => SettingsBloc(
              storageService: context.read<StorageService>(),
            )..add(const SettingsLoaded()),
          ),
          BlocProvider(
            create: (context) => FileBloc(
              fileRepository: context.read<FileRepository>(),
            )..add(const FilesLoaded()),
          ),
        ],
        child: BlocBuilder<SettingsBloc, SettingsState>(
          builder: (context, settingsState) {
            return MaterialApp(
              title: 'MindFlow',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              darkTheme: AppTheme.darkTheme,
              themeMode: settingsState.themeMode,
              localizationsDelegates: const [
                AppLocalizations.delegate,
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              supportedLocales: const [
                Locale('en', 'US'),
                Locale('zh', 'CN'),
              ],
              home: const HomeScreen(),
            );
          },
        ),
      ),
    );
  }
}
