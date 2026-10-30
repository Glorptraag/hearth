import Foundation

struct OutboxRecord: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let payload: NewEntryPayload
    let queuedAt: Date
    var attempts: Int
    var lastError: String?
}

struct FlushResult: Equatable, Sendable {
    var sent = 0
    var dropped = 0
    var remaining = 0
}

/// Retry rules, ported from `src/lib/logger/outbox.ts` so both clients behave
/// the same way for the same server reply.
enum OutboxPolicy {
    static let maxAttempts = 5

    enum Outcome: Equatable {
        case delivered
        /// The server will never accept this payload (e.g. 400 validation).
        case rejected
        /// Try again later. `countsAttempt` is false when the failure says
        /// nothing about the entry itself.
        case retry(countsAttempt: Bool)
    }

    static func outcome(forStatus status: Int) -> Outcome {
        switch status {
        case 200..<300: .delivered
        // Native-only: a 401 means the session lapsed between token fetch and
        // request. The entry is fine; keep it for after sign-in instead of
        // dropping it as the web does for every 4xx.
        case 401: .retry(countsAttempt: false)
        case 408, 429: .retry(countsAttempt: true)
        case 400..<500: .rejected
        default: .retry(countsAttempt: true)
        }
    }

    /// A network failure counts no attempt: a fortnight offline must not burn
    /// through the budget and delete a parent's entry.
    static let networkFailure = Outcome.retry(countsAttempt: false)
}

/// Pending Logger entries, persisted under Application Support with file
/// protection so children's records are encrypted while the device is locked.
@Observable
final class Outbox {
    typealias Send = (Data) async throws -> Int

    private(set) var records: [OutboxRecord] = []
    private(set) var lastResult: FlushResult?

    private let fileURL: URL
    private var flushTask: Task<FlushResult, Never>?

    init(directory: URL? = nil) {
        let base = directory ?? FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appending(path: "Outbox", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        fileURL = base.appending(path: "entries.json")
        records = Self.load(from: fileURL)
    }

    var pendingCount: Int { records.count }

    func enqueue(_ payload: NewEntryPayload, now: Date = .now) {
        records.append(OutboxRecord(id: UUID(), payload: payload, queuedAt: now, attempts: 0, lastError: nil))
        save()
    }

    /// Sends queued entries oldest-first. Concurrent calls share one run, so an
    /// entry can never be posted twice.
    @discardableResult
    func flush(send: @escaping Send) async -> FlushResult {
        if let flushTask { return await flushTask.value }
        let task = Task { await runFlush(send: send) }
        flushTask = task
        let result = await task.value
        flushTask = nil
        lastResult = result
        return result
    }

    /// Used on sign-out only; see `AppServices.signOut()`.
    func discardAll() {
        records = []
        save()
    }

    private func runFlush(send: Send) async -> FlushResult {
        var result = FlushResult()
        let encoder = JSONEncoder()

        for record in records.sorted(by: { $0.queuedAt < $1.queuedAt }) {
            let outcome: OutboxPolicy.Outcome
            var errorNote: String
            do {
                let status = try await send(try encoder.encode(record.payload))
                outcome = OutboxPolicy.outcome(forStatus: status)
                errorNote = "HTTP \(status)"
            } catch {
                outcome = OutboxPolicy.networkFailure
                errorNote = error.localizedDescription
            }

            switch outcome {
            case .delivered:
                remove(record.id)
                result.sent += 1
            case .rejected:
                remove(record.id)
                result.dropped += 1
            case .retry(let countsAttempt):
                var updated = record
                updated.lastError = errorNote
                if countsAttempt { updated.attempts += 1 }
                if updated.attempts >= OutboxPolicy.maxAttempts {
                    remove(record.id)
                    result.dropped += 1
                } else {
                    replace(updated)
                    result.remaining += 1
                }
            }
        }
        return result
    }

    private func remove(_ id: UUID) {
        records.removeAll { $0.id == id }
        save()
    }

    private func replace(_ record: OutboxRecord) {
        guard let index = records.firstIndex(where: { $0.id == record.id }) else { return }
        records[index] = record
        save()
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(records)
            try data.write(to: fileURL, options: [.atomic, .completeFileProtectionUnlessOpen])
        } catch {
            assertionFailure("Outbox save failed: \(error)")
        }
    }

    private static func load(from url: URL) -> [OutboxRecord] {
        guard let data = try? Data(contentsOf: url) else { return [] }
        return (try? JSONDecoder().decode([OutboxRecord].self, from: data)) ?? []
    }
}
