import ClerkKit
import SwiftUI

/// Native settings shell: things that belong to this device. Family and
/// account panels open the web settings (native plan v2 §3).
struct SettingsView: View {
    /// True when pushed inside another NavigationStack (iPhone Home menu).
    var embedded = false
    @Environment(AppServices.self) private var services
    @Environment(ThemeController.self) private var theme
    @State private var isConfirmingSignOut = false

    var body: some View {
        if embedded {
            form
        } else {
            NavigationStack { form }
        }
    }

    private var form: some View {
        @Bindable var theme = theme
        return Form {
            Section("Appearance") {
                Picker("Theme", selection: $theme.preference) {
                    ForEach(ThemeController.Preference.allCases) { preference in
                        Text(preference.label).tag(preference)
                    }
                }
                Text("Automatic uses Gathering from 6am to 6pm and Dark in the evening, the same as the web.")
                    .hearthFont(.meta)
                    .foregroundStyle(HearthColor.textMuted)
            }

            Section("Family") {
                ForEach([WebFeature.familySettings, .notifications, .portfolio]) { feature in
                    NavigationLink { WebFeatureView(feature: feature) } label: {
                        Label(feature.title, systemImage: feature.symbol)
                    }
                }
            }

            Section {
                Button {
                    Task { await services.store.restore() }
                } label: {
                    HStack {
                        Text("Restore purchases")
                        Spacer()
                        if services.store.isRestoring { ProgressView() }
                    }
                }
                .disabled(services.store.isRestoring || services.isDemo)
            } header: {
                Text("Purchases")
            } footer: {
                Text("Packs you've bought belong to your family on every device, on the web and in this app.")
            }

            Section("This device") {
                LabeledContent("Waiting to sync", value: "\(services.outbox.pendingCount)")
                LabeledContent("Connection", value: services.isOnline ? "Online" : "Offline")
            }

            Section("Account") {
                if !services.isDemo, let email = Clerk.shared.user?.primaryEmailAddress?.emailAddress {
                    LabeledContent("Signed in as", value: email)
                }
                Button("Sign out", role: .destructive) {
                    if services.outbox.pendingCount > 0 {
                        isConfirmingSignOut = true
                    } else {
                        Task { await services.signOut() }
                    }
                }
            }

            Section {
                ForEach([WebFeature.privacy, .terms]) { feature in
                    NavigationLink(feature.title) { WebFeatureView(feature: feature) }
                }
                LabeledContent("Version", value: AppConfig.clientIdentifier)
            }
        }
        .scrollContentBackground(.hidden)
        .hearthScreenBackground()
        .hearthReadableWidth(760)
        .navigationTitle("Settings")
        .confirmationDialog("Sign out and discard unsynced entries?", isPresented: $isConfirmingSignOut, titleVisibility: .visible) {
            Button("Sign out anyway", role: .destructive) {
                Task { await services.signOut() }
            }
        } message: {
            Text("\(services.outbox.pendingCount) entries haven't reached Hearth yet. Reconnect first to keep them.")
        }
    }
}
