import SwiftUI

/// Canonical v2 card: panel surface, cream-tinted border, no shadow.
/// Hover (iPad pointer) lifts the border to medium.
struct HearthCard<Content: View>: View {
    var isSelected = false
    @ViewBuilder var content: Content
    @State private var isHovered = false

    var body: some View {
        content
            .padding(HearthSpacing.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(HearthColor.surfacePanel, in: .rect(cornerRadius: HearthRadius.lg))
            .overlay {
                RoundedRectangle(cornerRadius: HearthRadius.lg)
                    .strokeBorder(borderColor, lineWidth: 1)
            }
            .onHover { hovering in
                withAnimation(HearthMotion.standard()) { isHovered = hovering }
            }
    }

    private var borderColor: Color {
        if isSelected { return HearthColor.borderActive }
        return isHovered ? HearthColor.borderMedium : HearthColor.borderSubtle
    }
}

struct HearthPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .hearthFont(.label)
            .fontWeight(.semibold)
            .foregroundStyle(HearthColor.textInverse)
            .padding(.horizontal, HearthSpacing.lg)
            .padding(.vertical, HearthSpacing.md)
            .frame(minHeight: 44)
            .background(configuration.isPressed ? HearthColor.emberHover : HearthColor.ember, in: .rect(cornerRadius: HearthRadius.md))
            .opacity(isEnabled ? 1 : 0.5)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(HearthMotion.standard(HearthMotion.instant), value: configuration.isPressed)
    }
}

struct HearthSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .hearthFont(.label)
            .foregroundStyle(HearthColor.textSecondary)
            .padding(.horizontal, HearthSpacing.lg)
            .padding(.vertical, HearthSpacing.md)
            .frame(minHeight: 44)
            .overlay {
                RoundedRectangle(cornerRadius: HearthRadius.md)
                    .strokeBorder(configuration.isPressed ? HearthColor.borderMedium : HearthColor.borderSubtle)
            }
            .contentShape(.rect(cornerRadius: HearthRadius.md))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(HearthMotion.standard(HearthMotion.instant), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == HearthPrimaryButtonStyle {
    static var hearthPrimary: HearthPrimaryButtonStyle { .init() }
}

extension ButtonStyle where Self == HearthSecondaryButtonStyle {
    static var hearthSecondary: HearthSecondaryButtonStyle { .init() }
}

struct LearnerAvatar: View {
    let name: String
    let colourToken: String?
    var size: CGFloat = 32

    var body: some View {
        let colour = LearnerColour(token: colourToken).color
        Text(String(name.prefix(1)).uppercased())
            .font(.system(size: size * 0.45, weight: .semibold, design: .rounded))
            .foregroundStyle(colour)
            .frame(width: size, height: size)
            .background(colour.opacity(0.15), in: .circle)
            .overlay(Circle().strokeBorder(colour.opacity(0.4)))
            .accessibilityHidden(true)
    }
}

/// Learner pill: the web's `pill` variant (tinted fill, tinted border).
struct LearnerChip: View {
    let learner: Learner
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        let colour = LearnerColour(token: learner.colourToken).color
        Button(action: action) {
            HStack(spacing: HearthSpacing.sm) {
                LearnerAvatar(name: learner.name, colourToken: learner.colourToken, size: 24)
                Text(learner.name).hearthFont(.label)
            }
            .padding(.leading, HearthSpacing.xs)
            .padding(.trailing, HearthSpacing.md)
            .padding(.vertical, HearthSpacing.xs)
            .frame(minHeight: 44)
            .foregroundStyle(isSelected ? HearthColor.textPrimary : HearthColor.textSecondary)
            .background(isSelected ? colour.opacity(0.15) : Color.clear, in: .capsule)
            .overlay(Capsule().strokeBorder(isSelected ? colour.opacity(0.5) : HearthColor.borderSubtle))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

/// Wrapping row layout for chips; wraps to as many lines as the width needs.
struct FlowLayout: Layout {
    var spacing: CGFloat = HearthSpacing.sm

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = arrange(width: proposal.width ?? .infinity, subviews: subviews)
        let height = rows.last.map { $0.y + $0.height } ?? 0
        let width = rows.map(\.width).max() ?? 0
        return CGSize(width: proposal.width ?? width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for row in arrange(width: bounds.width, subviews: subviews) {
            var x = bounds.minX
            for index in row.indices {
                let size = subviews[index].sizeThatFits(.unspecified)
                subviews[index].place(at: CGPoint(x: x, y: bounds.minY + row.y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
        }
    }

    private struct Row {
        var indices: [Int] = []
        var y: CGFloat = 0
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    private func arrange(width: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = [Row()]
        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(.unspecified)
            let needed = rows[rows.count - 1].indices.isEmpty ? size.width : rows[rows.count - 1].width + spacing + size.width
            if needed > width, !rows[rows.count - 1].indices.isEmpty {
                let last = rows[rows.count - 1]
                rows.append(Row(y: last.y + last.height + spacing))
            }
            var row = rows[rows.count - 1]
            row.width = row.indices.isEmpty ? size.width : row.width + spacing + size.width
            row.height = max(row.height, size.height)
            row.indices.append(index)
            rows[rows.count - 1] = row
        }
        return rows
    }
}

extension View {
    /// Caps reading and form columns at 680pt and centres them, so iPad
    /// layouts keep a comfortable line length.
    func hearthReadableWidth(_ maxWidth: CGFloat = 680) -> some View {
        frame(maxWidth: maxWidth).frame(maxWidth: .infinity)
    }

    /// Body background for full-screen surfaces.
    func hearthScreenBackground() -> some View {
        background(HearthColor.surfaceBody.ignoresSafeArea())
    }
}

/// Section header: serif title with an optional sans action link.
struct HearthSectionHeader: View {
    let title: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .hearthFont(.heading)
                .foregroundStyle(HearthColor.textPrimary)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .hearthFont(.label)
                    .foregroundStyle(HearthColor.ember)
            }
        }
    }
}

/// Empty / error / loading placeholder used by native screens.
struct HearthStatusView: View {
    let symbol: String
    let title: String
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        ContentUnavailableView {
            Label {
                Text(title).hearthFont(.heading)
            } icon: {
                Image(systemName: symbol).foregroundStyle(HearthColor.textMuted)
            }
        } description: {
            Text(message).hearthFont(.body).foregroundStyle(HearthColor.textSecondary)
        } actions: {
            if let retry {
                Button("Try again", action: retry).buttonStyle(.hearthSecondary)
            }
        }
    }
}
