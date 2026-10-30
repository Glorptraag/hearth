import SwiftUI

/// Today at a glance, from `GET /api/dashboard`.
struct HomeView: View {
    @Binding var selection: AppTab
    @Environment(AppServices.self) private var services
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var webDestination: WebFeature?

    private var family: FamilyStore { services.family }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: HearthSpacing.xl) {
                    greeting
                    if let dashboard = family.dashboard {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 320), spacing: HearthSpacing.lg, alignment: .top)],
                                  alignment: .leading, spacing: HearthSpacing.lg) {
                            todayCard(dashboard)
                            learnersCard(dashboard.learners)
                            recentCard(dashboard.recentEntries)
                            if !dashboard.todayPlanner.isEmpty {
                                plannerCard(dashboard.todayPlanner)
                            }
                        }
                    } else if case .failed(let message) = family.dashboardState {
                        HearthStatusView(symbol: "wifi.slash", title: "Home didn't load", message: message) {
                            Task { await family.loadDashboard() }
                        }
                    } else {
                        ProgressView().frame(maxWidth: .infinity, minHeight: 200)
                    }
                }
                .padding(HearthSpacing.lg)
                .frame(maxWidth: 1100)
                .frame(maxWidth: .infinity)
            }
            .refreshable { await family.refresh() }
            .hearthScreenBackground()
            .navigationTitle("Home")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                if sizeClass == .compact {
                    ToolbarItem(placement: .topBarTrailing) { compactMenu }
                }
            }
            .navigationDestination(item: $webDestination) { feature in
                WebFeatureView(feature: feature)
            }
        }
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: HearthSpacing.xs) {
            Text(Self.greetingPrefix(for: .now))
                .hearthFont(.display)
                .foregroundStyle(HearthColor.textPrimary)
            if let name = family.dashboard?.familyName, !name.isEmpty {
                Text("The \(name) family")
                    .hearthFont(.body)
                    .foregroundStyle(HearthColor.textSecondary)
            }
        }
    }

    private func todayCard(_ dashboard: Dashboard) -> some View {
        HearthCard {
            VStack(alignment: .leading, spacing: HearthSpacing.md) {
                Text("Today").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                Text(Self.todaySummary(count: dashboard.todayEntryCount))
                    .hearthFont(.cardTitle)
                    .foregroundStyle(HearthColor.textPrimary)
                if services.outbox.pendingCount > 0 {
                    Label("\(services.outbox.pendingCount) waiting to sync", systemImage: "icloud.and.arrow.up")
                        .hearthFont(.meta)
                        .foregroundStyle(HearthColor.textSecondary)
                }
                Button("Log something") { selection = .log }
                    .buttonStyle(.hearthPrimary)
            }
        }
    }

    private func learnersCard(_ learners: [Learner]) -> some View {
        HearthCard {
            VStack(alignment: .leading, spacing: HearthSpacing.md) {
                Text("Learners").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                if learners.isEmpty {
                    Text("Add your children on the web to start logging.")
                        .hearthFont(.body)
                        .foregroundStyle(HearthColor.textSecondary)
                }
                ForEach(learners) { learner in
                    HStack(spacing: HearthSpacing.md) {
                        LearnerAvatar(name: learner.name, colourToken: learner.colourToken, size: 36)
                        Text(learner.name).hearthFont(.cardTitle).foregroundStyle(HearthColor.textPrimary)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    private func recentCard(_ entries: [LearningEntry]) -> some View {
        HearthCard {
            VStack(alignment: .leading, spacing: HearthSpacing.md) {
                HStack {
                    Text("Recently").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                    Spacer()
                    Button("See all") { selection = .story }
                        .hearthFont(.label)
                        .foregroundStyle(HearthColor.ember)
                }
                if entries.isEmpty {
                    Text("Nothing logged yet. The first entry is the hardest.")
                        .hearthFont(.body)
                        .foregroundStyle(HearthColor.textSecondary)
                }
                ForEach(entries) { entry in
                    EntryRow(entry: entry)
                }
            }
        }
    }

    private func plannerCard(_ items: [PlannerItem]) -> some View {
        HearthCard {
            VStack(alignment: .leading, spacing: HearthSpacing.md) {
                Text("Planned for today").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                ForEach(items) { item in
                    Text(item.title ?? "Untitled")
                        .hearthFont(.body)
                        .foregroundStyle(HearthColor.textPrimary)
                }
                Button("Open the planner") { webDestination = .planner }
                    .buttonStyle(.hearthSecondary)
            }
        }
    }

    private var compactMenu: some View {
        Menu {
            Button("Constellation", systemImage: WebFeature.constellation.symbol) { webDestination = .constellation }
            Button("Reports", systemImage: WebFeature.reports.symbol) { webDestination = .reports }
            Button("Portfolio", systemImage: WebFeature.portfolio.symbol) { webDestination = .portfolio }
            Divider()
            NavigationLink { SettingsView(embedded: true) } label: {
                Label("Settings", systemImage: "gearshape")
            }
        } label: {
            Label("More", systemImage: "ellipsis.circle")
        }
    }

    static func greetingPrefix(for date: Date, calendar: Calendar = .current) -> String {
        switch calendar.component(.hour, from: date) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        default: "Good evening"
        }
    }

    static func todaySummary(count: Int) -> String {
        switch count {
        case 0: "Nothing logged yet today."
        case 1: "One moment logged today."
        default: "\(count) moments logged today."
        }
    }
}
