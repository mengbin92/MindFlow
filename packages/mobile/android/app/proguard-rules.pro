# ProGuard Rules for MindFlow

# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep classes used by reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# SQLite
-keep class org.sqlite.** { *; }

# Prevent obfuscation of model classes
-keep class com.mindflow.app.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep setters in Views so that animations can still work
-keepclassmembers public class * extends android.view.View {
    void set*(***);
    *** get*();
}

# We want to keep methods in Activity that could be used in the XML attribute onClick
-keepclassmembers class * extends android.app.Activity {
    public void *(android.view.View);
}

# For enumeration classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep R
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Don't warn
-dontwarn android.**
-dontwarn com.google.**
-dontwarn io.flutter.**
