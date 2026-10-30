import SwiftUI

/// Motion tokens from `docs/hearth-motion-system-v1.md` / globals.css.
/// Use these instead of literal durations, as on the web.
nonisolated enum HearthMotion {
    static let instant: Double = 0.1
    static let quick: Double = 0.2
    static let base: Double = 0.3
    static let gentle: Double = 0.4
    static let slow: Double = 0.6

    /// `--ease-default`: cubic-bezier(0.4, 0, 0.2, 1)
    static func standard(_ duration: Double = quick) -> Animation {
        .timingCurve(0.4, 0, 0.2, 1, duration: duration)
    }

    /// `--ease-out`: cubic-bezier(0.16, 1, 0.3, 1)
    static func out(_ duration: Double = base) -> Animation {
        .timingCurve(0.16, 1, 0.3, 1, duration: duration)
    }

    /// `--ease-soft-spring`: cubic-bezier(0.34, 1.2, 0.64, 1)
    static func softSpring(_ duration: Double = gentle) -> Animation {
        .timingCurve(0.34, 1.2, 0.64, 1, duration: duration)
    }
}

/// Radius scale: 6 / 10 / 16 / 24 only (design rule 7).
nonisolated enum HearthRadius {
    static let sm: CGFloat = 6
    static let md: CGFloat = 10
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
}

nonisolated enum HearthSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}
