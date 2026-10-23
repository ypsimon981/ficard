# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor 8: runtime annotation types must survive R8 full mode.
# Otherwise PluginHandle's annotation can be folded to null and GPS permission
# checks crash the native process. See ionic-team/capacitor#8589 and #8646.
-keepattributes *Annotation*
-keep @interface com.getcapacitor.annotation.** { *; }
-keep @interface com.getcapacitor.PluginMethod { *; }
-keep @interface com.getcapacitor.NativePlugin { *; }
-keepclassmembers class com.getcapacitor.PluginHandle {
    java.lang.Class pluginClass;
    com.getcapacitor.annotation.CapacitorPlugin pluginAnnotation;
    com.getcapacitor.NativePlugin legacyPluginAnnotation;
    com.getcapacitor.annotation.CapacitorPlugin getPluginAnnotation();
    com.getcapacitor.NativePlugin getLegacyPluginAnnotation();
    <init>(...);
}
