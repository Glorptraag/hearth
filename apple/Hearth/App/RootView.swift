import ClerkKit
import ClerkKitUI
import SwiftUI

/// Signed-in → app shell. Signed-out → the sign-in landing.
struct RootView: View {
    @Environment(Clerk.self) private var clerk

    var body: some View {
        Group {
            if clerk.user != nil {
                AppShell()
            } else if clerk.isLoaded {
                SignInLanding()
            } else {
                ProgressView()
                    .controlSize(.large)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .hearthScreenBackground()
            }
        }
        .animation(HearthMotion.standard(HearthMotion.base), value: clerk.user?.id)
    }
}

struct SignInLanding: View {
    @State private var isAuthPresented = false

    var body: some View {
        VStack(spacing: HearthSpacing.xl) {
            Spacer()
            Text("Hearth")
                .font(.hearth(.display))
                .fontWeight(.bold)
                .foregroundStyle(HearthColor.textPrimary)
            Text("Notice the learning that already happens at home.")
                .hearthFont(.body)
                .foregroundStyle(HearthColor.textSecondary)
                .multilineTextAlignment(.center)
            Spacer()
            Button("Sign in") { isAuthPresented = true }
                .buttonStyle(.hearthPrimary)
                .frame(maxWidth: 360)
        }
        .padding(HearthSpacing.xl)
        .hearthReadableWidth(480)
        .frame(maxHeight: .infinity)
        .hearthScreenBackground()
        .sheet(isPresented: $isAuthPresented) {
            AuthView()
        }
    }
}

/// Shown when the build has no Clerk key. Development builds only: see
/// `apple/Config/Local.xcconfig.example`.
struct ConfigurationMissingView: View {
    var body: some View {
        HearthStatusView(
            symbol: "key",
            title: "Hearth isn't configured",
            message: "Copy apple/Config/Local.xcconfig.example to Local.xcconfig, add the Clerk publishable key, and rebuild."
        )
        .hearthScreenBackground()
    }
}
