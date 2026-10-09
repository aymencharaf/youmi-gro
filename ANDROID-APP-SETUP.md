# YOUmi Android app — initial Capacitor integration

This project is prepared to wrap the existing YOUmi website in an Android app while preserving the current PHP API/session behavior.

## Current integration details

- Display name: `YOUmi`
- Android application ID: `com.youmi.gro`
- Hosted platform: `https://youmi.wuaze.com`
- Capacitor: 7.x
- Existing website and PHP backend remain the source of truth.

## Create the Android project (one time)

Run from the project root in a Node.js environment:

```bash
npm install
npm run build
npm run android:init
npm run android:sync
npm run android:open
```

Android Studio is required to build and sign the APK/AAB. In Android Studio, wait for Gradle sync to finish, then use **Build > Build Bundle(s) / APK(s)** for testing. For Google Play, create a signed **Android App Bundle (.aab)** using **Build > Generate Signed Bundle / APK**.

After frontend/config changes, run:

```bash
npm run android:sync
```

## Important release notes

1. This first integration loads the live website, so the phone needs an internet connection and the published website must be available.
2. This is an initial test build, not a guarantee of Google Play approval. Google Play may reject apps that provide only a thin website wrapper. Before submission, assess Play policies and add/test app-specific value such as reliable navigation, Android back handling, appropriate external-link handling, app icons/splash screen, privacy policy, data-safety disclosures, and account deletion where applicable.
3. The current `server.url` is intentional to keep the existing relative `/api.php` calls and PHP session behavior working without a backend rewrite. For a stronger production architecture, bundle the frontend locally and configure a secure API base URL/CORS/session-cookie behavior before release.
4. Use the final brand icon for Android launcher assets before release. `public/logo.png` is the source logo; Android Studio's generated default icon is not the final branding.
5. Test registration/login, store creation, product images, orders, BaridiMob subscription flow, welcome wheel, logout, and admin access on a real Android phone. Do not submit until all critical flows work.
6. Keep admin credentials, API secrets, and payment verification on the server; never embed secrets in the Android app.
