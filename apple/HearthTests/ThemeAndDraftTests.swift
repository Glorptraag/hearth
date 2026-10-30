import Foundation
import Testing
@testable import Hearth

struct ThemeAndDraftTests {
    private func date(hour: Int) -> Date {
        var components = DateComponents(year: 2026, month: 10, day: 28, hour: hour)
        components.timeZone = .current
        return Calendar.current.date(from: components)!
    }

    @Test(arguments: [(5, ThemeController.Resolved.dark), (6, .gathering), (12, .gathering), (17, .gathering), (18, .dark), (23, .dark)])
    func automaticThemeFollowsTheWebSchedule(hour: Int, expected: ThemeController.Resolved) {
        #expect(ThemeController.resolve(.automatic, at: date(hour: hour)) == expected)
    }

    @Test func manualThemeOverridesTheClock() {
        #expect(ThemeController.resolve(.dark, at: date(hour: 12)) == .dark)
        #expect(ThemeController.resolve(.gathering, at: date(hour: 22)) == .gathering)
    }

    @Test func manualChoicePersistsUnderTheWebKey() throws {
        let defaults = try #require(UserDefaults(suiteName: UUID().uuidString))
        let controller = ThemeController(defaults: defaults)
        controller.preference = .dark
        #expect(defaults.string(forKey: "hearth-theme") == "dark")
        controller.preference = .automatic
        #expect(defaults.string(forKey: "hearth-theme") == nil)
    }

    @Test func draftNeedsATitleAndTrimsWhitespace() {
        var draft = QuickLogDraft()
        draft.title = "   "
        #expect(draft.payload() == nil)

        draft.title = "  Baked bread "
        draft.notes = "  "
        draft.toggle("a")
        draft.toggle("b")
        draft.toggle("a")
        let payload = draft.payload()
        #expect(payload?.title == "Baked bread")
        #expect(payload?.description == nil)
        #expect(payload?.learnerIds == ["b"])
    }
}
