import SwiftUI

enum AppTab: Hashable {
    case home, story, log, plan, explore
    case constellation, reports, settings
}

/// Tab bar on compact width (iPhone, narrow iPad multitasking), sidebar on
/// regular width (native plan v2 §5). The five primary tabs mirror the web's
/// `navConfig.ts`; the secondary section shows in the iPad sidebar only and is
/// reached from Home's menu on iPhone.
struct AppShell: View {
    @Environment(AppServices.self) private var services
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var selection: AppTab = Self.initialTab

    private static var initialTab: AppTab {
        #if DEBUG
        DemoMode.isEnabled ? DemoMode.initialTab ?? .home : .home
        #else
        .home
        #endif
    }

    var body: some View {
        TabView(selection: $selection) {
            Tab("Home", systemImage: "house", value: .home) {
                HomeView(selection: $selection)
            }
            Tab("Story", systemImage: "book", value: .story) {
                StoryView()
            }
            Tab("Log", systemImage: "square.and.pencil", value: .log) {
                QuickLogView()
            }
            .badge(services.outbox.pendingCount)
            Tab("Plan", systemImage: "calendar", value: .plan) {
                WebHubView(title: "Plan", features: WebFeature.planHub)
            }
            Tab("Explore", systemImage: "safari", value: .explore) {
                WebHubView(title: "Explore", features: WebFeature.exploreHub)
            }

            // Regular width only: on compact these would overflow the tab
            // bar into a "More" tab and displace Explore. iPhone reaches them
            // from Home's menu instead.
            if sizeClass != .compact {
                TabSection("Your family") {
                    Tab("Constellation", systemImage: WebFeature.constellation.symbol, value: AppTab.constellation) {
                        NavigationStack { WebFeatureView(feature: .constellation) }
                    }
                    Tab("Reports", systemImage: WebFeature.reports.symbol, value: AppTab.reports) {
                        NavigationStack { WebFeatureView(feature: .reports) }
                    }
                    Tab("Settings", systemImage: "gearshape", value: AppTab.settings) {
                        SettingsView()
                    }
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .onChange(of: sizeClass) { _, newValue in
            // Those tabs disappear at compact width; don't strand the user on
            // one when an iPad window narrows.
            if newValue == .compact, [.constellation, .reports, .settings].contains(selection) {
                selection = .home
            }
        }
        .task {
            await services.family.refresh()
            await services.flushOutbox()
        }
    }
}

/// The Plan and Explore trays from the web nav, as a native hub of web features.
struct WebHubView: View {
    let title: String
    let features: [WebFeature]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 280), spacing: HearthSpacing.lg)], spacing: HearthSpacing.lg) {
                    ForEach(features) { feature in
                        NavigationLink(value: feature) {
                            HearthCard {
                                HStack(alignment: .top, spacing: HearthSpacing.md) {
                                    Image(systemName: feature.symbol)
                                        .font(.title3)
                                        .foregroundStyle(HearthColor.textSecondary)
                                        .frame(width: 28)
                                    VStack(alignment: .leading, spacing: HearthSpacing.xs) {
                                        Text(feature.title)
                                            .hearthFont(.cardTitle)
                                            .foregroundStyle(HearthColor.textPrimary)
                                        if let summary = feature.summary {
                                            Text(summary)
                                                .hearthFont(.meta)
                                                .foregroundStyle(HearthColor.textMuted)
                                        }
                                    }
                                    Spacer(minLength: 0)
                                    Image(systemName: "chevron.right")
                                        .foregroundStyle(HearthColor.textMuted)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(HearthSpacing.lg)
                .frame(maxWidth: 1100)
                .frame(maxWidth: .infinity)
            }
            .hearthScreenBackground()
            .navigationTitle(title)
            .navigationDestination(for: WebFeature.self) { feature in
                WebFeatureView(feature: feature)
            }
        }
    }
}
