import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../blocs/settings/settings_bloc.dart';
import '../ui/themes/app_theme.dart';
import '../utils/app_localizations.dart';
import 'app_router.dart';

class MindFlowAppView extends StatelessWidget {
  const MindFlowAppView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SettingsBloc, SettingsState>(
      builder: (context, settingsState) {
        return MaterialApp.router(
          title: 'MindFlow',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: settingsState.themeMode,
          locale: _resolveLocale(settingsState.language),
          routerConfig: AppRouter.router,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', 'US'), Locale('zh', 'CN')],
        );
      },
    );
  }

  Locale _resolveLocale(String language) {
    final parts = language.split('_');
    if (parts.length == 2) {
      return Locale(parts[0], parts[1]);
    }
    return Locale(parts.first);
  }
}
