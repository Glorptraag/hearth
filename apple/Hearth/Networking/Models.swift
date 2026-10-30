import Foundation

// Swift mirrors of the JSON the native app consumes. These are the API
// contract (native plan v2, principle 4): decode tolerantly, so every field
// the server may omit or null is optional, and unknown keys are ignored.
// The fixtures in HearthTests/Fixtures pin the shapes.

struct Learner: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let colourToken: String?
    let shapeIcon: String?
    let dateOfBirth: String?
    let displayOrder: Int?
}

struct EntryEvidence: Codable, Hashable, Sendable {
    let kind: String
    let content: String
    let caption: String?
}

struct LearningEntry: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let description: String?
    /// `yyyy-MM-dd`, the family's local date.
    let dateOccurred: String
    let subjects: [String]?
    let learnerIds: [String]?
    let status: String?
    let source: String?
    let evidenceUrls: [String]?
    let evidence: [EntryEvidence]?
    let createdAt: String?

    var occurredOn: Date? {
        HearthDate.day.date(from: dateOccurred)
    }
}

struct PlannerItem: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let date: String
    let title: String?
    let status: String?
    let session: String?
    let learnerIds: [String]?
    let subjects: [String]?
    let notes: String?
}

/// `GET /api/dashboard`. `snapshot` is free-form JSON and not decoded yet.
struct Dashboard: Codable, Sendable {
    let familyName: String?
    let learners: [Learner]
    let recentEntries: [LearningEntry]
    let todayPlanner: [PlannerItem]
    let todayEntryCount: Int
}

/// Body for `POST /api/entries`. Only `title` is required server-side.
struct NewEntryPayload: Codable, Hashable, Sendable {
    var title: String
    var description: String?
    var dateOccurred: String
    var learnerIds: [String]
    var source = "logger"
    var mode = "quick"
}

struct CreatedEntry: Codable, Sendable {
    let id: String
}

enum HearthDate {
    /// Calendar day in the device's time zone, matching the web Logger.
    nonisolated static let day: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
