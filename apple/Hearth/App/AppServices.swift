import ClerkKit
import Foundation
import Network

/// App-wide dependencies, injected through the SwiftUI environment.
@Observable
final class AppServices {
    let config: AppConfig
    let theme: ThemeController
    let api: APIClient
    let outbox: Outbox
    let family: FamilyStore
    let webSessionBridge: WebSessionBridge
    let store: StoreService
    /// Debug demo mode (`DemoMode`): no Clerk session exists.
    let isDemo: Bool
    private(set) var isOnline = true
    /// Set by `checkForRequiredUpdate()`; the app shows `UpdateRequiredView`.
    private(set) var requiresUpdate = false

    @ObservationIgnored private let pathMonitor = NWPathMonitor()

    init(config: AppConfig, tokens: TokenProvider = ClerkTokenProvider(), session: URLSession = .shared, isDemo: Bool = false) {
        self.config = config
        self.isDemo = isDemo
        theme = ThemeController()
        api = APIClient(baseURL: config.webOrigin, tokens: tokens, session: session)
        outbox = Outbox()
        family = FamilyStore(api: api)
        webSessionBridge = WebSessionBridge(api: api)
        store = StoreService(server: APIEntitlementServer(api: api))
        if !isDemo && config.isAuthConfigured {
            // Listen from launch so Ask to Buy approvals and purchases made
            // while Hearth was unreachable are delivered (plan v2.1 §4.1).
            // Without a Clerk key (tests, unconfigured builds) there is no
            // session to submit with, and touching Clerk.shared would trap.
            store.start()
        }
        startMonitoringConnectivity()
    }

    /// Reads the server's minimum supported build. Offline, an older server
    /// without the route, or a bad reply all leave the app usable.
    func checkForRequiredUpdate() async {
        guard !isDemo, let config: NativeConfig = try? await api.getPublic("api/native/config") else { return }
        requiresUpdate = UpdateGate.requiresUpdate(build: UpdateGate.currentBuild, minimum: config.minSupportedBuild)
    }

    /// Sends queued Logger entries. Safe to call often; runs coalesce.
    @discardableResult
    func flushOutbox() async -> FlushResult {
        guard outbox.pendingCount > 0 else { return FlushResult() }
        let api = api
        let result = await outbox.flush { body in
            try await api.postRaw("api/entries", body: body)
        }
        if result.sent > 0 {
            await family.refresh()
        }
        return result
    }

    /// Clears everything tied to the signed-in family so the next account
    /// starts clean. Unsynced entries are discarded: posting them under a
    /// different account would file one family's records in another's.
    func signOut() async {
        if !isDemo { try? await Clerk.shared.auth.signOut() }
        outbox.discardAll()
        family.clear()
        store.clearOwnership()
        await WebSessionBridge.clearWebSession()
    }

    private func startMonitoringConnectivity() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor in
                guard let self else { return }
                let cameOnline = online && !self.isOnline
                self.isOnline = online
                if cameOnline { await self.flushOutbox() }
            }
        }
        pathMonitor.start(queue: DispatchQueue(label: "com.hearthlms.app.path-monitor"))
    }
}

struct ClerkTokenProvider: TokenProvider {
    func sessionToken() async throws -> String? {
        try await Clerk.shared.auth.getToken()
    }
}
