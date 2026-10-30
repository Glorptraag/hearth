import Foundation

/// Decides what a hosted web page may navigate to. Pure, so it is unit-tested.
struct WebNavigationPolicy {
    enum Decision: Equatable {
        case allow
        /// Leave the app: Safari, Mail, Phone.
        case openExternally
        /// The web session is missing; sign the webview in, then go to `next`.
        case handoff(next: String)
    }

    let origin: URL

    /// Paths that never render inside the native app (native plan v2 §3).
    static let excludedPrefixes = ["/admin", "/studio"]
    static let signInPrefixes = ["/sign-in", "/sign-up"]

    func decide(_ url: URL, isMainFrame: Bool) -> Decision {
        guard let scheme = url.scheme?.lowercased() else { return .allow }
        if ["about", "blob", "data"].contains(scheme) { return .allow }
        guard scheme == "http" || scheme == "https" else { return .openExternally }

        // Subframes (embedded video, Clerk's frames) load in place.
        guard isMainFrame else { return .allow }

        if isSameOrigin(url) {
            let path = url.path()
            if Self.excludedPrefixes.contains(where: { path.hasPrefix($0) }) { return .openExternally }
            if Self.signInPrefixes.contains(where: { path.hasPrefix($0) }) {
                return .handoff(next: returnPath(fromSignIn: url))
            }
            return .allow
        }

        // Clerk's frontend API (prod `clerk.<domain>`, dev `*.clerk.accounts.dev`).
        if let host = url.host()?.lowercased(),
           host.hasPrefix("clerk.") || host.hasSuffix(".clerk.accounts.dev") || host.hasSuffix(".accounts.dev") {
            return .allow
        }
        return .openExternally
    }

    /// Clerk sends signed-out visitors to `/sign-in?redirect_url=<absolute URL>`.
    /// Recover the same-origin path to return to; anything else goes Home.
    func returnPath(fromSignIn url: URL) -> String {
        let redirect = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?.first { $0.name == "redirect_url" }?.value
        guard let redirect, let target = URL(string: redirect, relativeTo: origin)?.absoluteURL,
              isSameOrigin(target) else { return "/dashboard" }
        return Self.safeRelativePath(target.path() + (target.query().map { "?\($0)" } ?? "")) ?? "/dashboard"
    }

    /// Accepts only `/path` forms. Rejects `//host` and absolute URLs so the
    /// handoff can never become an open redirect.
    static func safeRelativePath(_ candidate: String) -> String? {
        guard candidate.hasPrefix("/"), !candidate.hasPrefix("//"), !candidate.contains("\\") else { return nil }
        return candidate
    }

    private func isSameOrigin(_ url: URL) -> Bool {
        url.scheme?.lowercased() == origin.scheme?.lowercased()
            && url.host()?.lowercased() == origin.host()?.lowercased()
            && url.port == origin.port
    }
}
