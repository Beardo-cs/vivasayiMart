# VivasayiMart mobile apps (Android + iOS)

The apps are the website wrapped with [Capacitor](https://capacitorjs.com). One codebase: change the React
app, rebuild, sync.

```bash
cd client
npm run cap:android   # builds the web app, syncs it, opens Android Studio  -> press Run
npm run cap:ios       # builds the web app, syncs it, opens Xcode            -> press Run
```

Needs: Android Studio (Java 21 is bundled in it) and Xcode. iOS uses Swift Package Manager (no CocoaPods).

## Notes
- **Android Studio version:** the project uses Android Gradle plugin **8.10.1** (Capacitor 8 defaults to 8.13.0) so it opens in
  Android Studio 2024.3. If you update Android Studio you can move to 8.13.0 again (`client/android/build.gradle`).
- **iPhone simulator** needs macOS's simulator service to match Xcode: if it won't start, run `sudo xcodebuild -runFirstLaunch`.
  Emoji show as `?` boxes in some simulator runtimes; real iPhones are fine.
- Fonts (Nunito, Noto Sans Tamil) and icons (Font Awesome Free) are **bundled**, not loaded from a CDN, so the apps and the
  offline website show them reliably.

## How the app differs from the website
- API address: inside the app there is no website address, so calls go to `https://vivasayimart.vercel.app`
  (override with `REACT_APP_API_URL` at build time). See `client/src/utils/native.js`.
- Shared links always use the public address (`REACT_APP_PUBLIC_URL`), never `capacitor://localhost`.
- The service worker is not registered in the app (the app already contains its files).
- Android back button, status bar colour, system share sheet and shared-link opening: `utils/native.js`.
- The server allows the app's built-in addresses (`capacitor://localhost`, `https://localhost`): `middleware/cors.js`.
- Account deletion works inside the app (required by both stores): `DELETE /api/auth/account`.

## Before the first store release
- [ ] App id: `com.vivasayimart.app` (in `client/capacitor.config.json`). **Cannot be changed after publishing.**
- [ ] Proper 1024x1024 logo in `client/assets/icon-only.png` (current one is upscaled from 512px), then `npm run cap:assets`.
- [ ] Apple Developer account ($99/year) and Google Play Developer account ($25 once).
- [ ] Push notifications (Firebase): needs `google-services.json` (Android), `GoogleService-Info.plist` + APNs key (iOS).
      Apple rejects apps that are only a website, so this is important for iOS.
- [ ] Shared links opening the app: `assetlinks.json` (Android SHA-256) and `apple-app-site-association` (Apple team id).
- [ ] Release signing: Android upload key/keystore, iOS signing in Xcode.
- [ ] Store listings (Tamil + English), screenshots, privacy labels (Apple) / Data safety (Google), privacy URL
      `https://vivasayimart.vercel.app/privacy`.
- [ ] Google Play: new personal accounts must run a closed test with testers for about 14 days first (check current rules).
- [ ] Test on real phones: camera upload, back button, Tamil, offline banner, notch/safe areas.

## Local testing against your own server
Build the web app with `REACT_APP_API_URL=http://10.0.2.2:4000` (Android emulator -> your computer), and for plain
HTTP temporarily set `"server": {"androidScheme": "http", "cleartext": true}` in `capacitor.config.json`.
**Remove it again before a release build.**
