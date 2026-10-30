# Forge for iOS (Xcode)

A native iOS app that runs the Forge web app (`index.html`, `app.js`, `styles.css`) inside a WebView.
The Xcode project points straight at those files in the repo root, so any change you make to the
web app is picked up the next time you build. There's nothing to copy across.

## Run it

1. Open `ios/Forge.xcodeproj` in Xcode.
2. Click the **Forge** project, then the **Forge** target > **Signing & Capabilities**, and pick your Team
   (your Apple ID works). Change the Bundle Identifier if Xcode says it's taken.
3. Choose an iPhone simulator at the top and press **Run** (⌘R).

## With or without the server

At launch the app checks for the Forge backend at `ForgeServerURL` in `ios/Forge/Info.plist`
(default `http://localhost:8788`).

- **Server running** (`cd server && npm start`): the app loads from it, so real accounts, sync and
  Stripe work. The Simulator reaches your Mac at `localhost`.
- **Server not running**: the app loads the copy built into the app, and accounts stay on the phone
  (same as `preview.html`).
- **Real iPhone**: `localhost` is the phone, not your Mac. Set `ForgeServerURL` to your Mac's network
  address (System Settings > Wi-Fi > Details), e.g. `http://192.168.1.20:8788`, with both on the same Wi-Fi.
  Later this becomes your public `https://` server address.

## Debugging

In Debug builds you can inspect the page with Safari: Safari > Settings > Advanced > show Develop menu,
then Develop > (Simulator or your iPhone) > Forge.

## Before the App Store

- Apple doesn't allow Stripe for digital subscriptions inside iOS apps. Forge Premium needs Apple
  In-App Purchase (RevenueCat makes this easier).
- Apple may reject an app that's only a website in a wrapper. Native touches (notifications, Apple Health,
  widgets) help.
- Remove `NSAllowsArbitraryLoadsInWebContent` from Info.plist once the server is on `https://`.
