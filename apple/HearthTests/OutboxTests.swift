import Foundation
import Testing
@testable import Hearth

struct OutboxTests {
    private func makeOutbox() -> Outbox {
        let directory = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        return Outbox(directory: directory)
    }

    private func payload(_ title: String) -> NewEntryPayload {
        NewEntryPayload(title: title, description: nil, dateOccurred: "2026-10-28", learnerIds: [])
    }

    @Test(arguments: [
        (200, OutboxPolicy.Outcome.delivered),
        (201, .delivered),
        (400, .rejected),
        (403, .rejected),
        (401, .retry(countsAttempt: false)),
        (408, .retry(countsAttempt: true)),
        (429, .retry(countsAttempt: true)),
        (500, .retry(countsAttempt: true)),
        (503, .retry(countsAttempt: true)),
    ])
    func outcomeMatchesWebPolicy(status: Int, expected: OutboxPolicy.Outcome) {
        #expect(OutboxPolicy.outcome(forStatus: status) == expected)
    }

    @Test func deliveredEntriesLeaveTheQueueInOrder() async {
        let outbox = makeOutbox()
        outbox.enqueue(payload("first"), now: Date(timeIntervalSince1970: 1))
        outbox.enqueue(payload("second"), now: Date(timeIntervalSince1970: 2))

        var sentTitles: [String] = []
        let result = await outbox.flush { body in
            sentTitles.append(try JSONDecoder().decode(NewEntryPayload.self, from: body).title)
            return 201
        }

        #expect(sentTitles == ["first", "second"])
        #expect(result == FlushResult(sent: 2, dropped: 0, remaining: 0))
        #expect(outbox.pendingCount == 0)
    }

    @Test func networkFailureNeverSpendsAnAttempt() async {
        let outbox = makeOutbox()
        outbox.enqueue(payload("offline"))

        for _ in 0..<(OutboxPolicy.maxAttempts * 2) {
            await outbox.flush { _ in throw URLError(.notConnectedToInternet) }
        }

        #expect(outbox.pendingCount == 1)
        #expect(outbox.records.first?.attempts == 0)
    }

    @Test func serverErrorsDropAfterTheCap() async {
        let outbox = makeOutbox()
        outbox.enqueue(payload("doomed"))

        var last = FlushResult()
        for _ in 0..<OutboxPolicy.maxAttempts {
            last = await outbox.flush { _ in 500 }
        }

        #expect(last.dropped == 1)
        #expect(outbox.pendingCount == 0)
    }

    @Test func queueSurvivesRelaunch() {
        let directory = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        Outbox(directory: directory).enqueue(payload("kept"))
        let reopened = Outbox(directory: directory)
        #expect(reopened.records.map(\.payload.title) == ["kept"])
    }
}
