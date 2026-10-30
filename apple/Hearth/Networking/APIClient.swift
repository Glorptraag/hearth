import Foundation

/// Supplies the Clerk session token for `Authorization: Bearer`.
protocol TokenProvider: Sendable {
    func sessionToken() async throws -> String?
}

enum APIError: Error, Equatable {
    case notSignedIn
    case offline
    case http(status: Int)
    case decoding(String)

    var isNetwork: Bool { self == .offline }
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .notSignedIn: "You're signed out. Sign in again to continue."
        case .offline: "You're offline. Hearth will catch up when you reconnect."
        case .http(let status) where status >= 500: "Hearth couldn't reach the server (\(status)). Try again shortly."
        case .http(let status): "That didn't work (\(status))."
        case .decoding: "Hearth got a reply it didn't understand. Updating the app may fix this."
        }
    }
}

/// The only way the native app talks to Hearth: JSON over `/api/*` on the web
/// origin, authenticated with the Clerk session token. No direct database or
/// CMS access (native plan v2, principle 1).
final class APIClient: Sendable {
    let baseURL: URL
    private let tokens: TokenProvider
    private let session: URLSession

    init(baseURL: URL, tokens: TokenProvider, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.tokens = tokens
        self.session = session
    }

    func get<Response: Decodable>(_ path: String, query: [URLQueryItem] = [], as type: Response.Type = Response.self) async throws -> Response {
        let request = try await makeRequest(path: path, method: "GET", query: query, body: nil)
        return try await send(request)
    }

    /// For the few public routes (e.g. `/api/native/config`) that must work
    /// before sign-in. Sends no Authorization header.
    func getPublic<Response: Decodable>(_ path: String, as type: Response.Type = Response.self) async throws -> Response {
        let request = try await makeRequest(path: path, method: "GET", query: [], body: nil, authenticated: false)
        return try await send(request)
    }

    func post<Body: Encodable, Response: Decodable>(_ path: String, body: Body, as type: Response.Type = Response.self) async throws -> Response {
        let data = try JSONEncoder().encode(body)
        let request = try await makeRequest(path: path, method: "POST", query: [], body: data)
        return try await send(request)
    }

    /// Sends a pre-encoded body and returns only the status. Used by the outbox,
    /// which stores payloads as bytes.
    func postRaw(_ path: String, body: Data) async throws -> Int {
        try await postRawWithBody(path, body: body).0
    }

    /// Like `postRaw`, but also returns the body for callers that read a reply
    /// on non-2xx statuses too (the IAP route reports its decision in both).
    func postRawWithBody(_ path: String, body: Data) async throws -> (Int, Data) {
        let request = try await makeRequest(path: path, method: "POST", query: [], body: body)
        let (data, response) = try await perform(request)
        return (response.statusCode, data)
    }

    private func makeRequest(path: String, method: String, query: [URLQueryItem], body: Data?, authenticated: Bool = true) async throws -> URLRequest {
        var token: String?
        if authenticated {
            token = try await tokens.sessionToken()
            guard token != nil else { throw APIError.notSignedIn }
        }

        var components = URLComponents(url: baseURL.appending(path: path), resolvingAgainstBaseURL: false)
        if !query.isEmpty { components?.queryItems = query }
        guard let url = components?.url else { throw APIError.http(status: 400) }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(AppConfig.clientIdentifier, forHTTPHeaderField: "X-Hearth-Client")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return request
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await perform(request)
        guard (200..<300).contains(response.statusCode) else {
            throw response.statusCode == 401 ? APIError.notSignedIn : APIError.http(status: response.statusCode)
        }
        do {
            return try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    private func perform(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw APIError.http(status: 0) }
            return (data, http)
        } catch let error as URLError where error.isConnectivity {
            throw APIError.offline
        }
    }
}

extension URLError {
    var isConnectivity: Bool {
        switch code {
        case .notConnectedToInternet, .networkConnectionLost, .timedOut,
             .cannotConnectToHost, .cannotFindHost, .dnsLookupFailed,
             .internationalRoamingOff, .dataNotAllowed:
            true
        default:
            false
        }
    }
}
