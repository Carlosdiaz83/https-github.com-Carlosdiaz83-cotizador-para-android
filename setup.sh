#!/bin/bash

echo "============================================"
echo "  Script de compilación APK - Codespaces"
echo "============================================"

# Ir a la carpeta android
cd android || { echo "Carpeta 'android' no encontrada"; exit 1; }

# Regenerar local.properties limpio
echo "sdk.dir=/usr/local/android-sdk" > local.properties
echo "local.properties regenerado con ruta de SDK en Codespaces"

# Forzar compatibilidad con Java 17
sed -i 's/sourceCompatibility JavaVersion\..*/sourceCompatibility JavaVersion.VERSION_17/' app/build.gradle
sed -i 's/targetCompatibility JavaVersion\..*/targetCompatibility JavaVersion.VERSION_17/' app/build.gradle

# Limpiar proyecto
echo "Limpiando proyecto..."
./gradlew clean

# Compilar APK en modo debug
echo "Compilando APK..."
./gradlew assembleDebug --stacktrace

# Mostrar resultado
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "============================================"
    echo "  APK generado con éxito:"
    echo "  $APK_PATH"
    echo "============================================"
else
    echo "============================================"
    echo "  ERROR: No se encontró el APK generado"
    echo "  Revisar el log de compilación arriba"
    echo "============================================"
fi
