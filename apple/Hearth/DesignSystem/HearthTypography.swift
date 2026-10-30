import CoreText
import SwiftUI
import UIKit

/// Fraunces (serif) is for content the parent reads; DM Sans (sans) is for
/// interface the parent operates (design rules 5 and 6). Axis values match the
/// `.display` / `.heading` / `.body-serif` utilities in globals.css.
enum HearthTextStyle {
    /// Display greeting. Weight 700 is reserved for the wordmark and the greeting's emphasis.
    case display
    /// Section titles (600).
    case heading
    /// Card titles (600).
    case cardTitle
    /// Body copy the parent reads.
    case body
    /// Buttons, chips, nav: sans 500.
    case label
    /// Timestamps and metadata: sans 400.
    case meta
    /// Uppercase overlines: sans 600.
    case overline

    fileprivate var spec: (family: HearthFontFamily, size: CGFloat, weight: CGFloat, soft: CGFloat, opsz: CGFloat?, relativeTo: UIFont.TextStyle) {
        switch self {
        case .display: (.serif, 30, 600, 80, 144, .largeTitle)
        case .heading: (.serif, 21, 600, 50, 24, .title2)
        case .cardTitle: (.serif, 17, 600, 50, 24, .headline)
        case .body: (.serif, 16, 400, 50, 14, .body)
        case .label: (.sans, 15, 500, 0, nil, .callout)
        case .meta: (.sans, 13, 400, 0, nil, .footnote)
        case .overline: (.sans, 11, 600, 0, nil, .caption2)
        }
    }
}

fileprivate enum HearthFontFamily: String {
    case serif = "Fraunces"
    case sans = "DM Sans"
}

private enum FontAxis {
    // OpenType axis tags as 4-char codes.
    static let weight = NSNumber(value: 0x7767_6874) // 'wght'
    static let opticalSize = NSNumber(value: 0x6F70_737A) // 'opsz'
    static let softness = NSNumber(value: 0x534F_4654) // 'SOFT'
}

extension Font {
    static func hearth(_ style: HearthTextStyle, dynamicTypeSize: DynamicTypeSize = .large) -> Font {
        let spec = style.spec
        let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(dynamicTypeSize))
        let scaledSize = UIFontMetrics(forTextStyle: spec.relativeTo).scaledValue(for: spec.size, compatibleWith: traits)

        var axes: [NSNumber: NSNumber] = [FontAxis.weight: NSNumber(value: Double(spec.weight))]
        if spec.family == .serif {
            axes[FontAxis.softness] = NSNumber(value: Double(spec.soft))
            axes[FontAxis.opticalSize] = NSNumber(value: Double(spec.opsz ?? min(max(scaledSize, 9), 144)))
        }

        let variationKey = UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String)
        let descriptor = UIFontDescriptor(fontAttributes: [.family: spec.family.rawValue, variationKey: axes])
        let font = UIFont(descriptor: descriptor, size: scaledSize)

        // A missing font file falls back to the system font silently; keep it
        // obvious in development instead.
        assert(font.familyName == spec.family.rawValue, "\(spec.family.rawValue) is not bundled")
        return Font(font as CTFont)
    }
}

private struct HearthFontModifier: ViewModifier {
    let style: HearthTextStyle
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    func body(content: Content) -> some View {
        content
            .font(.hearth(style, dynamicTypeSize: dynamicTypeSize))
            .textCase(style == .overline ? .uppercase : nil)
            .tracking(style == .overline ? 0.8 : 0)
    }
}

extension View {
    /// Applies a Hearth text style that follows Dynamic Type.
    func hearthFont(_ style: HearthTextStyle) -> some View {
        modifier(HearthFontModifier(style: style))
    }
}

private extension UIContentSizeCategory {
    init(_ size: DynamicTypeSize) {
        switch size {
        case .xSmall: self = .extraSmall
        case .small: self = .small
        case .medium: self = .medium
        case .large: self = .large
        case .xLarge: self = .extraLarge
        case .xxLarge: self = .extraExtraLarge
        case .xxxLarge: self = .extraExtraExtraLarge
        case .accessibility1: self = .accessibilityMedium
        case .accessibility2: self = .accessibilityLarge
        case .accessibility3: self = .accessibilityExtraLarge
        case .accessibility4: self = .accessibilityExtraExtraLarge
        case .accessibility5: self = .accessibilityExtraExtraExtraLarge
        @unknown default: self = .large
        }
    }
}
