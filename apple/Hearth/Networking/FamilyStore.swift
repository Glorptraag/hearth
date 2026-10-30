import Foundation

/// The signed-in family's data for native screens. The last good dashboard is
/// kept on disk (file-protected) so Home and the Logger's learner picker work
/// on a cold launch in airplane mode.
@Observable
final class FamilyStore {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    private(set) var dashboard: Dashboard?
    private(set) var dashboardState: LoadState = .idle
    private(set) var entries: [LearningEntry] = []
    private(set) var entriesState: LoadState = .idle

    var learners: [Learner] { dashboard?.learners ?? [] }

    private let api: APIClient
    private let cacheURL: URL

    init(api: APIClient, cacheDirectory: URL? = nil) {
        self.api = api
        let base = cacheDirectory ?? FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appending(path: "Cache", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        cacheURL = base.appending(path: "dashboard.json")
        dashboard = Self.loadCache(from: cacheURL)
    }

    func learner(id: String) -> Learner? {
        learners.first { $0.id == id }
    }

    func refresh() async {
        async let dashboardLoad: Void = loadDashboard()
        async let entriesLoad: Void = loadEntries()
        _ = await (dashboardLoad, entriesLoad)
    }

    func loadDashboard() async {
        dashboardState = .loading
        do {
            let fresh: Dashboard = try await api.get("api/dashboard")
            dashboard = fresh
            dashboardState = .loaded
            saveCache(fresh)
        } catch {
            // A cached dashboard stays on screen; the error only shows when
            // there is nothing to show.
            dashboardState = .failed(error.localizedDescription)
        }
    }

    func loadEntries(learnerId: String? = nil) async {
        entriesState = .loading
        var query = [URLQueryItem(name: "limit", value: "50")]
        if let learnerId { query.append(URLQueryItem(name: "learnerId", value: learnerId)) }
        do {
            entries = try await api.get("api/entries", query: query)
            entriesState = .loaded
        } catch {
            entriesState = .failed(error.localizedDescription)
        }
    }

    func clear() {
        dashboard = nil
        entries = []
        dashboardState = .idle
        entriesState = .idle
        try? FileManager.default.removeItem(at: cacheURL)
    }

    private func saveCache(_ dashboard: Dashboard) {
        guard let data = try? JSONEncoder().encode(dashboard) else { return }
        try? data.write(to: cacheURL, options: [.atomic, .completeFileProtectionUnlessOpen])
    }

    private static func loadCache(from url: URL) -> Dashboard? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Dashboard.self, from: data)
    }
}
