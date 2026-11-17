# ChoiceCLASH ProGuard / R8 rules
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn io.socket.**
-dontwarn org.json.**
-keepattributes Signature, InnerClasses, EnclosingMethod
-keep class com.choiceclash.chess.data.** { *; }
-keep class com.choiceclash.chess.chess.** { *; }
