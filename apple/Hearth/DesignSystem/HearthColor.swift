import SwiftUI
import UIKit

/// Mont Blanc Dark Coffee v2 tokens, transcribed from `src/app/globals.css`.
/// Change these in the same PR as the CSS (native plan v2, principle 7).
///
/// Each token resolves against the trait collection: `.dark` → dark theme,
/// `.light` → gathering. `ThemeController` drives the scheme, so the system
/// appearance never picks the palette on its own.
enum HearthColor {
    // Surfaces
    static let surfaceBody = adaptive(gathering: .hex(0xFDF6F0), dark: .hex(0x15110D))
    static let surfacePanel = adaptive(gathering: .hex(0xFAF8F5), dark: .hex(0x1A1612))
    static let surfaceRaised = adaptive(gathering: .hex(0xF5F5F0), dark: .hex(0x252117))
    static let surfaceHover = adaptive(gathering: .hex(0xECE8E2), dark: .hex(0x2D2621))
    static let surfaceInput = adaptive(gathering: .hex(0xFFFFFF), dark: .hex(0x1E1A16))

    // Text
    static let textPrimary = adaptive(gathering: .hex(0x2C2418), dark: .hex(0xE8DFD4))
    static let textSecondary = adaptive(gathering: .hex(0x4A5568), dark: .hex(0xB0A094))
    static let textMuted = adaptive(gathering: .hex(0x718096), dark: .hex(0x877565))
    static let textInverse = adaptive(gathering: .hex(0xFFFFFF), dark: .hex(0x15110D))

    // Ember: actions only (design rule 1)
    static let ember = adaptive(gathering: .hex(0xC05621), dark: .hex(0xD97B3A))
    static let emberHover = adaptive(gathering: .hex(0x92400E), dark: .hex(0xE88F4E))
    static let emberGlow = adaptive(gathering: .rgba(192, 86, 33, 0.10), dark: .rgba(217, 123, 58, 0.15))

    // Sage: growth and success only (design rule 3)
    static let sage = adaptive(gathering: .hex(0x5A9168), dark: .hex(0x7BBF8A))
    static let sageMuted = adaptive(gathering: .rgba(90, 145, 104, 0.10), dark: .rgba(123, 191, 138, 0.12))
    static let sageText = adaptive(gathering: .hex(0x2D5C3D), dark: .hex(0x9BD4A8))

    // Borders: cream-tinted by default, ember only as a state signal (rule 9)
    static let borderSubtle = adaptive(gathering: .rgba(44, 36, 24, 0.06), dark: .rgba(232, 223, 212, 0.06))
    static let borderMedium = adaptive(gathering: .rgba(44, 36, 24, 0.10), dark: .rgba(232, 223, 212, 0.10))
    static let borderActive = adaptive(gathering: .rgba(192, 86, 33, 0.30), dark: .rgba(217, 123, 58, 0.30))
    static let borderFocus = adaptive(gathering: .rgba(192, 86, 33, 0.50), dark: .rgba(217, 123, 58, 0.50))

    // Child identity
    static let childRose = adaptive(gathering: .hex(0xB5838D), dark: .hex(0xD4A0A0))
    static let childBlue = adaptive(gathering: .hex(0x4D7AA0), dark: .hex(0x7BA3C9))
    static let childSage = adaptive(gathering: .hex(0x5A9168), dark: .hex(0x8BAA7B))
    static let childAmber = adaptive(gathering: .hex(0xB8853F), dark: .hex(0xC9A86B))
    static let childViolet = adaptive(gathering: .hex(0x7C6A8D), dark: .hex(0x9E8FB8))

    private static func adaptive(gathering: RGBA, dark: RGBA) -> Color {
        let gatheringColor = gathering.uiColor
        let darkColor = dark.uiColor
        return Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? darkColor : gatheringColor
        })
    }
}

/// Mirror of `LEARNER_COLOUR_MAP` in `src/components/ui/LearnerAvatar.tsx`.
/// Unknown or missing tokens fall back to rose, as on the web.
enum LearnerColour: String, CaseIterable, Sendable {
    case rose, blue, sage, amber, violet

    init(token: String?) {
        self = token.flatMap(LearnerColour.init(rawValue:)) ?? .rose
    }

    var color: Color {
        switch self {
        case .rose: HearthColor.childRose
        case .blue: HearthColor.childBlue
        case .sage: HearthColor.childSage
        case .amber: HearthColor.childAmber
        case .violet: HearthColor.childViolet
        }
    }
}

struct RGBA: Sendable {
    let red: Double
    let green: Double
    let blue: Double
    let alpha: Double

    static func hex(_ value: UInt32) -> RGBA {
        RGBA(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255,
            alpha: 1
        )
    }

    static func rgba(_ red: Int, _ green: Int, _ blue: Int, _ alpha: Double) -> RGBA {
        RGBA(red: Double(red) / 255, green: Double(green) / 255, blue: Double(blue) / 255, alpha: alpha)
    }

    var uiColor: UIColor {
        UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }
}
