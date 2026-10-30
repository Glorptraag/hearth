import SwiftUI

/// Native counterpart of `useTheme()` (`src/hooks/use-theme.ts`).
///
/// Gathering 6am–6pm, dark 6pm–6am, unless the parent picked one. The manual
/// choice persists under the same key the web uses (`hearth-theme`); a missing
/// value means automatic.
@Observable
final class ThemeController {
    enum Preference: String, CaseIterable, Identifiable {
        case automatic
        case gathering
        case dark

        var id: String { rawValue }

        var label: String {
            switch self {
            case .automatic: "Automatic"
            case .gathering: "Gathering"
            case .dark: "Dark"
            }
        }
    }

    enum Resolved: Equatable {
        case gathering
        case dark

        var colorScheme: ColorScheme {
            self == .dark ? .dark : .light
        }
    }

    static let storageKey = "hearth-theme"

    var preference: Preference {
        didSet { persist() }
    }

    private(set) var now: Date = .now
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let stored = defaults.string(forKey: Self.storageKey)
        self.preference = stored.flatMap(Preference.init(rawValue:)) ?? .automatic
    }

    var resolved: Resolved {
        Self.resolve(preference, at: now)
    }

    /// Re-reads the clock so automatic mode flips at 6am/6pm while the app is open.
    func refreshClock() {
        now = .now
    }

    static func resolve(_ preference: Preference, at date: Date, calendar: Calendar = .current) -> Resolved {
        switch preference {
        case .gathering: return .gathering
        case .dark: return .dark
        case .automatic:
            let hour = calendar.component(.hour, from: date)
            return (6..<18).contains(hour) ? .gathering : .dark
        }
    }

    private func persist() {
        if preference == .automatic {
            defaults.removeObject(forKey: Self.storageKey)
        } else {
            defaults.set(preference.rawValue, forKey: Self.storageKey)
        }
    }
}
