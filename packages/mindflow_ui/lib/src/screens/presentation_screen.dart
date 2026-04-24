import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'package:mindflow_ui/render/presentation_service.dart';

class PresentationScreen extends StatefulWidget {
  final String markdown;
  final String title;
  final String theme;

  const PresentationScreen({
    super.key,
    required this.markdown,
    this.title = '',
    this.theme = 'black',
  });

  @override
  State<PresentationScreen> createState() => _PresentationScreenState();
}

class _PresentationScreenState extends State<PresentationScreen> {
  late final WebViewController _webViewController;
  int _currentSlide = 0;
  int _totalSlides = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    const presentationService = PresentationService();
    final presentationHtml = presentationService.buildPresentationHtml(
      markdown: widget.markdown,
      theme: widget.theme,
    );

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            setState(() => _isLoading = false);
            _updateSlideState();
          },
        ),
      )
      ..loadHtmlString(presentationHtml);
  }

  Future<void> _nextSlide() async {
    await _webViewController.runJavaScript('Reveal.right();');
    await _updateSlideState();
  }

  Future<void> _previousSlide() async {
    await _webViewController.runJavaScript('Reveal.left();');
    await _updateSlideState();
  }

  Future<void> _updateSlideState() async {
    try {
      final result = await _webViewController.runJavaScriptReturningResult(
        'JSON.stringify({index: Reveal.getIndices().h, total: Reveal.getTotalSlides()})',
      );
      final raw = result.toString();
      // result is like {"index":0,"total":2}
      final indexMatch = RegExp(r'"index":(\d+)').firstMatch(raw);
      final totalMatch = RegExp(r'"total":(\d+)').firstMatch(raw);
      if (indexMatch != null && totalMatch != null && mounted) {
        setState(() {
          _currentSlide = int.parse(indexMatch.group(1)!);
          _totalSlides = int.parse(totalMatch.group(1)!);
        });
      }
    } catch (_) {
      // Ignore JS evaluation errors during page load
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          WebViewWidget(controller: _webViewController),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _PresentationControls(
              currentSlide: _currentSlide,
              totalSlides: _totalSlides,
              onPrevious: _previousSlide,
              onNext: _nextSlide,
              onClose: () => Navigator.of(context).maybePop(),
            ),
          ),
        ],
      ),
    );
  }
}

class _PresentationControls extends StatelessWidget {
  final int currentSlide;
  final int totalSlides;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onClose;

  const _PresentationControls({
    required this.currentSlide,
    required this.totalSlides,
    required this.onPrevious,
    required this.onNext,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.8)],
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              onPressed: onClose,
              icon: const Icon(Icons.close, color: Colors.white),
              tooltip: '退出演示',
            ),
            const SizedBox(width: 16),
            IconButton(
              onPressed: onPrevious,
              icon: const Icon(Icons.chevron_left, color: Colors.white, size: 32),
              tooltip: '上一页',
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                totalSlides > 0
                    ? '${currentSlide + 1} / $totalSlides'
                    : '- / -',
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
            IconButton(
              onPressed: onNext,
              icon: const Icon(Icons.chevron_right, color: Colors.white, size: 32),
              tooltip: '下一页',
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
