import SwiftUI
import WebKit

/// Hosts the Forge web app (index.html / app.js / styles.css) in a WKWebView.
///
/// On launch it checks whether the Forge backend (server/) is reachable at
/// `ForgeServerURL` (set in Info.plist). If it is, the app loads from the server,
/// so real accounts, sync and Stripe all work. If not, it loads the copy of the
/// web files bundled inside the app, and Forge falls back to on-device accounts,
/// exactly like opening preview.html without a server.
struct ContentView: View {
    @State private var source: WebSource?

    var body: some View {
        ZStack {
            Color(red: 10/255, green: 11/255, blue: 13/255).ignoresSafeArea()
            if let source {
                ForgeWebView(source: source)
            } else {
                ProgressView().tint(.white)
            }
        }
        .task { source = await WebSource.resolve() }
    }
}

enum WebSource: Equatable {
    case server(URL)
    case bundled

    /// Server URL from Info.plist (key: ForgeServerURL). Leave empty to always use bundled files.
    static var configuredServer: URL? {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "ForgeServerURL") as? String,
              !raw.trimmingCharacters(in: .whitespaces).isEmpty else { return nil }
        return URL(string: raw)
    }

    static func resolve() async -> WebSource {
        guard let base = configuredServer else { return .bundled }
        var request = URLRequest(url: base.appendingPathComponent("api/auth/me"))
        request.timeoutInterval = 2
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if response is HTTPURLResponse { return .server(base) }
        } catch {
            print("Forge: server not reachable at \(base) (\(error.localizedDescription)); using bundled files.")
        }
        return .bundled
    }
}

struct ForgeWebView: UIViewRepresentable {
    let source: WebSource

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // keeps localStorage + cookies between launches
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.allowsBackForwardNavigationGestures = true
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }  // Safari > Develop > Simulator
        #endif

        switch source {
        case .server(let url):
            webView.load(URLRequest(url: url))
        case .bundled:
            if let index = Bundle.main.url(forResource: "index", withExtension: "html") {
                webView.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
            }
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        // Links with target="_blank" open in the same view instead of being dropped.
        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil { webView.load(navigationAction.request) }
            return nil
        }

        // mailto:, tel: and similar open in the matching iOS app.
        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               !["http", "https", "file", "about", "data", "blob"].contains(scheme) {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        // Native dialogs for window.alert / confirm, in case the web app ever uses them.
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            present(message, on: webView, actions: [("OK", true)]) { _ in completionHandler() }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            present(message, on: webView, actions: [("Cancel", false), ("OK", true)], completion: completionHandler)
        }

        private func present(_ message: String, on view: UIView,
                             actions: [(String, Bool)], completion: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            for (title, value) in actions {
                alert.addAction(UIAlertAction(title: title, style: value ? .default : .cancel) { _ in completion(value) })
            }
            var top = view.window?.rootViewController
            while let next = top?.presentedViewController { top = next }
            guard let top else { completion(false); return }
            top.present(alert, animated: true)
        }
    }
}
