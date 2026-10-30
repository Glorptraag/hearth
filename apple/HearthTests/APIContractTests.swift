import Foundation
import Testing
@testable import Hearth

/// The fixtures mirror real `/api/*` responses, including fields the app
/// ignores. A route change that breaks these is a breaking change for shipped
/// native builds (native plan v2, principle 4).
struct APIContractTests {
    private func fixture(_ name: String) throws -> Data {
        let url = try #require(Bundle(for: BundleToken.self).url(forResource: name, withExtension: "json"))
        return try Data(contentsOf: url)
    }

    @Test func decodesDashboard() throws {
        let dashboard = try JSONDecoder().decode(Dashboard.self, from: fixture("dashboard"))
        #expect(dashboard.familyName == "Douglas")
        #expect(dashboard.learners.map(\.name) == ["Ada", "Theo"])
        #expect(dashboard.learners[1].colourToken == nil)
        #expect(dashboard.recentEntries.first?.occurredOn != nil)
        #expect(dashboard.todayPlanner.first?.title == "Nature walk")
    }

    @Test func decodesEntriesWithAndWithoutOptionalFields() throws {
        let entries = try JSONDecoder().decode([LearningEntry].self, from: fixture("entries"))
        #expect(entries.count == 2)
        #expect(entries[0].evidence?.map(\.kind) == ["photo", "quote"])
        #expect(entries[1].learnerIds == nil)
        #expect(entries[1].description == nil)
    }

    @Test func newEntryPayloadMatchesCreateEntrySchema() throws {
        let payload = NewEntryPayload(title: "Baked bread", description: nil, dateOccurred: "2026-10-28", learnerIds: ["a"])
        let json = try #require(try JSONSerialization.jsonObject(with: JSONEncoder().encode(payload)) as? [String: Any])
        // Keys accepted by createEntrySchema in src/app/api/entries/route.ts.
        let allowed: Set<String> = ["title", "description", "dateOccurred", "learnerIds", "source", "mode"]
        #expect(Set(json.keys).isSubset(of: allowed))
        #expect(json["source"] as? String == "logger")
        #expect(json["mode"] as? String == "quick")
    }

    @Test func unknownLearnerColourFallsBackToRose() {
        #expect(LearnerColour(token: nil) == .rose)
        #expect(LearnerColour(token: "teal") == .rose)
        #expect(LearnerColour(token: "amber") == .amber)
    }
}

private final class BundleToken {}
