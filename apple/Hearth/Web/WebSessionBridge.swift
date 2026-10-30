import Foundation
import WebKit

/// Signs the shared webview cookie store in as the native user (native plan
/// v2 §4, phase N1). The server mints a single-use Clerk sign-in ticket; the
/// public `/native/handoff` page redeems it and continues to `next`.
final class WebSessionBridge {
    private struct HandoffRequest: Encodable { let next: String }
    private struct HandoffResponse: Decodable { let url: String }

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    /// Nil when the bridge is unavailable (offline, signed out, or a server
    /// without the N1 route); the caller then shows the web sign-in page.
    func handoffURL(next: String) async -> URL? {
        guard let safeNext = WebNavigationPolicy.safeRelativePath(next) else { return nil }
        do {
            let response: HandoffResponse = try await api.post("api/native/web-session", body: HandoffRequest(next: safeNext))
            guard let path = WebNavigationPolicy.safeRelativePath(response.url) else { return nil }
            return URL(string: path, relativeTo: api.baseURL)?.absoluteURL
        } catch {
            return nil
        }
    }

    /// Native sign-out must also sign the webview out: its cookies would
    /// otherwise keep the previous family's session alive.
    static func clearWebSession() async {
        let store = WKWebsiteDataStore.default()
        await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
    }
}
