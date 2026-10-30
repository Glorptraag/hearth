#if DEBUG
import Foundation

/// Debug-only: launch with `-HearthDemo` to run the signed-in shell against
/// canned API responses, with no Clerk session and no network. Used to check
/// layouts on every simulator size. Compiled out of release builds.
enum DemoMode {
    static var isEnabled: Bool {
        ProcessInfo.processInfo.arguments.contains("-HearthDemo")
    }

    /// `-HearthTab story` opens on a given tab, for screenshots.
    static var initialTab: AppTab? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-HearthTab"), index + 1 < arguments.count else { return nil }
        return switch arguments[index + 1] {
        case "story": .story
        case "log": .log
        case "plan": .plan
        case "explore": .explore
        case "settings": .settings
        default: .home
        }
    }

    static func makeServices() -> AppServices {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [DemoURLProtocol.self]
        return AppServices(
            config: AppConfig(webOrigin: AppConfig.defaultOrigin, clerkPublishableKey: ""),
            tokens: DemoTokenProvider(),
            session: URLSession(configuration: configuration),
            isDemo: true
        )
    }
}

private struct DemoTokenProvider: TokenProvider {
    func sessionToken() async throws -> String? { "demo" }
}

nonisolated private final class DemoURLProtocol: URLProtocol {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let path = request.url?.path() ?? ""
        let (status, body): (Int, String) = switch (request.httpMethod ?? "GET", path) {
        case ("GET", "/api/dashboard"): (200, DemoData.dashboard)
        case ("GET", "/api/entries"): (200, DemoData.entries)
        case ("POST", "/api/entries"): (201, #"{"id":"demo-new"}"#)
        default: (404, #"{"error":"Not in demo data"}"#)
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(body.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

nonisolated private enum DemoData {
    static let today = HearthDate.day.string(from: .now)
    static let yesterday = HearthDate.day.string(from: .now.addingTimeInterval(-86_400))

    static let learners = """
    [
      {"id":"l-ada","name":"Ada","colourToken":"sage","displayOrder":0},
      {"id":"l-theo","name":"Theo","colourToken":"blue","displayOrder":1},
      {"id":"l-wren","name":"Wren","colourToken":"amber","displayOrder":2}
    ]
    """

    static let entryList = """
    [
      {"id":"e1","title":"Measured the garden beds","description":"Ada used the long tape and drew a plan to scale. Theo counted the steps between each bed.","dateOccurred":"\(today)","subjects":["mathematics","science"],"learnerIds":["l-ada","l-theo"],"status":"enriched","evidence":[{"kind":"quote","content":"It's longer than me lying down twice!"},{"kind":"photo","content":"x"}]},
      {"id":"e2","title":"Read The Wind in the Willows, chapter 3","description":"Narrated back the Wild Wood scene.","dateOccurred":"\(today)","subjects":["english"],"learnerIds":["l-wren"],"status":"enriched"},
      {"id":"e3","title":"Baked bread and talked about yeast","dateOccurred":"\(yesterday)","subjects":["science"],"learnerIds":["l-ada","l-theo","l-wren"],"status":"draft"}
    ]
    """

    static let dashboard = """
    {"familyName":"Douglas","todayEntryCount":2,"learners":\(learners),"recentEntries":\(entryList),
     "todayPlanner":[{"id":"p1","date":"\(today)","title":"Nature walk at the creek"},{"id":"p2","date":"\(today)","title":"Fractions with pizza"}]}
    """

    static let entries = entryList
}
#endif
