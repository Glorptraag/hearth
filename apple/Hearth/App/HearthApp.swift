import ClerkKit
import SwiftUI

@main
struct HearthApp: App {
    @State private var services: AppServices
    @Environment(\.scenePhase) private var scenePhase

    init() {
        #if DEBUG
        if DemoMode.isEnabled {
            _services = State(initialValue: DemoMode.makeServices())
            return
        }
        #endif
        let config = AppConfig(bundle: .main)
        if config.isAuthConfigured {
            Clerk.configure(publishableKey: config.clerkPublishableKey)
        }
        _services = State(initialValue: AppServices(config: config))
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if services.requiresUpdate {
                    UpdateRequiredView()
                } else if services.isDemo {
                    AppShell()
                } else if services.config.isAuthConfigured {
                    RootView()
                        .environment(Clerk.shared)
                        .onOpenURL { url in
                            Task { try? await Clerk.shared.handle(url) }
                        }
                } else {
                    ConfigurationMissingView()
                }
            }
            .environment(services)
            .environment(services.theme)
            .preferredColorScheme(services.theme.resolved.colorScheme)
            .tint(HearthColor.ember)
            .task { await services.checkForRequiredUpdate() }
            .task {
                // Automatic theme flips at 6am/6pm while the app stays open.
                while !Task.isCancelled {
                    try? await Task.sleep(for: .seconds(60))
                    services.theme.refreshClock()
                }
            }
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            services.theme.refreshClock()
            Task { await services.flushOutbox() }
            Task { await services.checkForRequiredUpdate() }
            if services.config.isAuthConfigured && !services.isDemo {
                Task { await services.store.processUnfinished() }
            }
        }
    }
}
