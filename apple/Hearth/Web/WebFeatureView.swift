import SwiftUI
import WebKit

/// Hosts one web feature in a WKWebView inside native navigation.
struct WebFeatureView: View {
    let feature: WebFeature
    @Environment(AppServices.self) private var services
    @State private var model: WebFeatureModel?

    var body: some View {
        ZStack {
            if let model {
                WebViewContainer(webView: model.webView)
                    .ignoresSafeArea(edges: .bottom)
                if let failure = model.failure {
                    HearthStatusView(symbol: "wifi.slash", title: "Can't open \(feature.title)", message: failure) {
                        model.reload()
                    }
                    .hearthScreenBackground()
                } else if model.isLoading && !model.hasLoadedOnce {
                    ProgressView().controlSize(.large)
                }
            }
        }
        .hearthScreenBackground()
        .navigationTitle(feature.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button("Reload", systemImage: "arrow.clockwise") { model?.reload() }
            }
        }
        .sheet(item: Binding(get: { model?.download }, set: { model?.download = $0 })) { file in
            ShareSheet(items: [file.url])
        }
        .task {
            guard model == nil else { return }
            let created = WebFeatureModel(feature: feature, services: services)
            model = created
            created.loadInitial()
        }
    }
}

struct DownloadedFile: Identifiable {
    let url: URL
    var id: URL { url }
}

@Observable
final class WebFeatureModel: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    let webView: WKWebView
    private(set) var isLoading = false
    private(set) var hasLoadedOnce = false
    private(set) var failure: String?
    var download: DownloadedFile?

    private let feature: WebFeature
    private let policy: WebNavigationPolicy
    private let bridge: WebSessionBridge
    private var handoffAttempted = false

    init(feature: WebFeature, services: AppServices) {
        self.feature = feature
        self.policy = WebNavigationPolicy(origin: services.config.webOrigin)
        self.bridge = services.webSessionBridge

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.applicationNameForUserAgent = AppConfig.webUserAgentSuffix
        configuration.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()

        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic

        let refresh = UIRefreshControl()
        refresh.addAction(UIAction { [weak self, weak refresh] _ in
            self?.reload()
            refresh?.endRefreshing()
        }, for: .valueChanged)
        webView.scrollView.refreshControl = refresh
    }

    func loadInitial() {
        load(path: feature.path)
    }

    func reload() {
        failure = nil
        if webView.url == nil { loadInitial() } else { webView.reload() }
    }

    private func load(path: String) {
        guard let url = URL(string: path, relativeTo: policy.origin)?.absoluteURL else { return }
        webView.load(URLRequest(url: url))
    }

    // MARK: Navigation

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        if navigationAction.shouldPerformDownload {
            decisionHandler(.download)
            return
        }
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        switch policy.decide(url, isMainFrame: navigationAction.targetFrame?.isMainFrame ?? true) {
        case .allow:
            decisionHandler(.allow)
        case .openExternally:
            decisionHandler(.cancel)
            UIApplication.shared.open(url)
        case .handoff(let next):
            // One attempt per view: if the bridge is unavailable (server not
            // yet on N1) fall through to the web sign-in page.
            guard !handoffAttempted else {
                decisionHandler(.allow)
                return
            }
            handoffAttempted = true
            decisionHandler(.cancel)
            Task {
                if let handoff = await bridge.handoffURL(next: next) {
                    webView.load(URLRequest(url: handoff))
                } else {
                    webView.load(URLRequest(url: url))
                }
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping @MainActor (WKNavigationResponsePolicy) -> Void) {
        decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
        failure = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        hasLoadedOnce = true
        // Signed in again; allow a future handoff if the session lapses later.
        if let path = webView.url?.path(), !WebNavigationPolicy.signInPrefixes.contains(where: { path.hasPrefix($0) }) {
            handoffAttempted = false
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        fail(with: error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        fail(with: error)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    private func fail(with error: Error) {
        isLoading = false
        let nsError = error as NSError
        // Cancelled loads (a new navigation replaced this one) are not failures.
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled { return }
        if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 { return } // frame load interrupted by download
        failure = (error as? URLError)?.isConnectivity == true
            ? "You're offline. \(feature.title) needs a connection; your native screens still work."
            : error.localizedDescription
    }

    // MARK: Windows

    /// `target="_blank"` links: keep Hearth pages in this view, send the rest out.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            switch policy.decide(url, isMainFrame: true) {
            case .openExternally: UIApplication.shared.open(url)
            default: webView.load(navigationAction.request)
            }
        }
        return nil
    }

    // MARK: Downloads (report and portfolio PDFs → share sheet)

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping @MainActor (URL?) -> Void) {
        let folder = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString, directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let destination = folder.appending(path: suggestedFilename.isEmpty ? "Hearth.pdf" : suggestedFilename)
        pendingDownloads[ObjectIdentifier(download)] = destination
        completionHandler(destination)
    }

    func downloadDidFinish(_ download: WKDownload) {
        if let url = pendingDownloads.removeValue(forKey: ObjectIdentifier(download)) {
            self.download = DownloadedFile(url: url)
        }
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        pendingDownloads.removeValue(forKey: ObjectIdentifier(download))
        failure = "The download didn't finish. \(error.localizedDescription)"
    }

    @ObservationIgnored private var pendingDownloads: [ObjectIdentifier: URL] = [:]
}

private struct WebViewContainer: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
