import SwiftUI

/// `GET /api/native/config` (native plan v2.1 §4). Builds below
/// `minSupportedBuild` stop calling routes whose contract has moved on.
struct NativeConfig: Codable, Sendable {
    let minSupportedBuild: Int
}

enum UpdateGate {
    /// True only on a definite answer. A missing or unparseable build number
    /// never locks the app: failing open beats bricking every install.
    static func requiresUpdate(build: String?, minimum: Int) -> Bool {
        guard let build, let current = Int(build) else { return false }
        return current < minimum
    }

    static var currentBuild: String? {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String
    }
}

struct UpdateRequiredView: View {
    var body: some View {
        VStack(spacing: HearthSpacing.lg) {
            Text("Time to update Hearth")
                .hearthFont(.display)
                .foregroundStyle(HearthColor.textPrimary)
                .multilineTextAlignment(.center)
            Text("This version can no longer talk to Hearth. Update from the App Store and everything you've logged will be waiting.")
                .hearthFont(.body)
                .foregroundStyle(HearthColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(HearthSpacing.xl)
        .hearthReadableWidth(480)
        .frame(maxHeight: .infinity)
        .hearthScreenBackground()
    }
}
