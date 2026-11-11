#!/bin/bash
# Monta o APK de Android com Capacitor a partir de scp_remake.html (usado no GitHub Actions).
set -e
ROOT=$(pwd)
python3 -m pip install -q pillow
rm -rf app && mkdir -p app/www && cp scp_remake.html app/www/index.html
cd app
npm init -y >/dev/null
npm i --no-audit --no-fund @capacitor/core@7.4.4 @capacitor/cli@7.4.4 @capacitor/android@7.4.4
cat > capacitor.config.json <<JSON
{"appId":"com.robson18.scpremake","appName":"SCP Remake","webDir":"www",
 "android":{"appendUserAgent":"SCPRemakeApp","backgroundColor":"#050506"}}
JSON
npx cap add android
# gira com o celular (em pé ou deitado) e tela cheia
M=android/app/src/main/AndroidManifest.xml
sed -i 's|<activity|<activity android:screenOrientation="fullUser"|' $M
cp "$ROOT/android/MainActivity.java" android/app/src/main/java/com/robson18/scpremake/MainActivity.java
# ícone do jogo
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do n=${d%%:*}; s=${d##*:}
  f=android/app/src/main/res/mipmap-$n; mkdir -p $f
  python3 -c "from PIL import Image;im=Image.open('$ROOT/android/icon.png').convert('RGBA').resize(($s,$s),Image.LANCZOS);im.save('$f/ic_launcher.png');im.save('$f/ic_launcher_round.png');im.save('$f/ic_launcher_foreground.png')"
done
rm -rf android/app/src/main/res/mipmap-anydpi-v26
npx cap sync android
cd android && chmod +x gradlew && ./gradlew --no-daemon -q assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk "$ROOT/SCP_Remake_Android.apk"
ls -la "$ROOT/SCP_Remake_Android.apk"
