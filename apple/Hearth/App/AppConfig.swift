import Foundation

/// Build-time configuration from `Config/*.xcconfig`, surfaced through Info.plist.
nonisolated struct AppConfig: Sendable {
    /// The Hearth web origin. Serves both `/api/*` and hosted web features.
    let webOrigin: URL
    /// Clerk publishable key. Must belong to the same Clerk instance as `webOrigin`.
    let clerkPublishableKey: String

    static let defaultOrigin = URL(string: "https://www.hearth-lms.com")!

    init(webOrigin: URL, clerkPublishableKey: String) {
        self.webOrigin = webOrigin
        self.clerkPublishableKey = clerkPublishableKey
    }

    init(bundle: Bundle) {
        let origin = (bundle.object(forInfoDictionaryKey: "HearthWebOrigin") as? String)
            .flatMap { URL(string: $0.trimmingCharacters(in: .whitespaces)) }
            .flatMap { $0.host() == nil ? nil : $0 }
        let key = (bundle.object(forInfoDictionaryKey: "ClerkPublishableKey") as? String) ?? ""
        self.init(
            webOrigin: origin ?? Self.defaultOrigin,
            clerkPublishableKey: key.trimmingCharacters(in: .whitespaces)
        )
    }

    var isAuthConfigured: Bool {
        clerkPublishableKey.hasPrefix("pk_")
    }

    /// Sent as `X-Hearth-Client` on every API call so the server can tell
    /// builds apart (native plan v2 §4).
    static var clientIdentifier: String {
        let info = Bundle.main.infoDictionary
        let version = info?["CFBundleShortVersionString"] as? String ?? "0"
        let build = info?["CFBundleVersion"] as? String ?? "0"
        return "ios/\(version)(\(build))"
    }

    /// Appended to the WKWebView user agent. Must contain `NATIVE_UA_MARKER`
    /// from `src/lib/platform/native.ts` so the web strips digital purchases.
    static let webUserAgentSuffix = "Mobile/15E148 HearthNative/ios"
}
