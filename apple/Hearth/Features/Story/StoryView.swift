import SwiftUI

/// Entries list with detail. Side by side on iPad, a stack on iPhone.
struct StoryView: View {
    @Environment(AppServices.self) private var services
    @State private var selectedEntryID: LearningEntry.ID?
    @State private var learnerFilter: Learner.ID?
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    private var family: FamilyStore { services.family }

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            list
                .navigationTitle("Story")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) { filterMenu }
                }
                .navigationSplitViewColumnWidth(min: 300, ideal: 360, max: 440)
        } detail: {
            if let entry = family.entries.first(where: { $0.id == selectedEntryID }) {
                EntryDetailView(entry: entry)
            } else {
                HearthStatusView(symbol: "book", title: "Pick an entry", message: "Choose a moment from the list to read it here.")
                    .hearthScreenBackground()
            }
        }
        .navigationSplitViewStyle(.balanced)
        .task(id: learnerFilter) {
            await family.loadEntries(learnerId: learnerFilter)
        }
    }

    @ViewBuilder
    private var list: some View {
        if family.entries.isEmpty, case .failed(let message) = family.entriesState {
            HearthStatusView(symbol: "wifi.slash", title: "Story didn't load", message: message) {
                Task { await family.loadEntries(learnerId: learnerFilter) }
            }
        } else if family.entries.isEmpty, family.entriesState == .loaded {
            HearthStatusView(symbol: "square.and.pencil", title: "No entries yet", message: "Logged moments appear here.")
        } else {
            List(selection: $selectedEntryID) {
                ForEach(Self.groupedByDay(family.entries), id: \.day) { group in
                    Section {
                        ForEach(group.entries) { entry in
                            EntryRow(entry: entry).tag(entry.id)
                        }
                    } header: {
                        Text(group.day).hearthFont(.overline)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(HearthColor.surfaceBody)
            .refreshable { await family.loadEntries(learnerId: learnerFilter) }
            .overlay {
                if family.entriesState == .loading && family.entries.isEmpty { ProgressView() }
            }
        }
    }

    private var filterMenu: some View {
        Menu {
            Picker("Learner", selection: $learnerFilter) {
                Text("Everyone").tag(Learner.ID?.none)
                ForEach(family.learners) { learner in
                    Text(learner.name).tag(Learner.ID?.some(learner.id))
                }
            }
        } label: {
            Label("Filter", systemImage: learnerFilter == nil ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
        }
    }

    struct DayGroup {
        let day: String
        let entries: [LearningEntry]
    }

    /// Groups newest-first entries by their `dateOccurred`, keeping order.
    static func groupedByDay(_ entries: [LearningEntry]) -> [DayGroup] {
        var groups: [DayGroup] = []
        for entry in entries {
            let label = entry.occurredOn.map { $0.formatted(.dateTime.weekday(.wide).day().month(.wide)) } ?? entry.dateOccurred
            if let last = groups.last, last.day == label {
                groups[groups.count - 1] = DayGroup(day: label, entries: last.entries + [entry])
            } else {
                groups.append(DayGroup(day: label, entries: [entry]))
            }
        }
        return groups
    }
}

struct EntryRow: View {
    let entry: LearningEntry
    @Environment(AppServices.self) private var services

    var body: some View {
        HStack(alignment: .top, spacing: HearthSpacing.md) {
            VStack(alignment: .leading, spacing: HearthSpacing.xs) {
                Text(entry.title)
                    .hearthFont(.cardTitle)
                    .foregroundStyle(HearthColor.textPrimary)
                    .lineLimit(2)
                if let description = entry.description, !description.isEmpty {
                    Text(description)
                        .hearthFont(.meta)
                        .foregroundStyle(HearthColor.textSecondary)
                        .lineLimit(2)
                }
            }
            Spacer(minLength: 0)
            HStack(spacing: -6) {
                ForEach(learners) { learner in
                    LearnerAvatar(name: learner.name, colourToken: learner.colourToken, size: 22)
                }
            }
        }
        .padding(.vertical, HearthSpacing.xs)
        .accessibilityElement(children: .combine)
        .accessibilityHint(learners.map(\.name).joined(separator: ", "))
    }

    private var learners: [Learner] {
        (entry.learnerIds ?? []).compactMap(services.family.learner(id:))
    }
}

struct EntryDetailView: View {
    let entry: LearningEntry
    @Environment(AppServices.self) private var services

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: HearthSpacing.xl) {
                VStack(alignment: .leading, spacing: HearthSpacing.sm) {
                    Text(entry.occurredOn?.formatted(date: .complete, time: .omitted) ?? entry.dateOccurred)
                        .hearthFont(.meta)
                        .foregroundStyle(HearthColor.textMuted)
                    Text(entry.title)
                        .hearthFont(.display)
                        .foregroundStyle(HearthColor.textPrimary)
                }

                let learners = (entry.learnerIds ?? []).compactMap(services.family.learner(id:))
                if !learners.isEmpty {
                    FlowLayout {
                        ForEach(learners) { learner in
                            LearnerChip(learner: learner, isSelected: true) {}
                                .disabled(true)
                        }
                    }
                }

                if let description = entry.description, !description.isEmpty {
                    Text(description)
                        .hearthFont(.body)
                        .foregroundStyle(HearthColor.textPrimary)
                        .textSelection(.enabled)
                }

                if let subjects = entry.subjects, !subjects.isEmpty {
                    VStack(alignment: .leading, spacing: HearthSpacing.sm) {
                        Text("Subjects").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                        Text(subjects.map { $0.replacingOccurrences(of: "_", with: " ").capitalized }.joined(separator: " · "))
                            .hearthFont(.label)
                            .foregroundStyle(HearthColor.textSecondary)
                    }
                }

                let notes = (entry.evidence ?? []).filter { $0.kind == "quote" || $0.kind == "note" }
                if !notes.isEmpty {
                    VStack(alignment: .leading, spacing: HearthSpacing.md) {
                        Text("Evidence").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
                        ForEach(Array(notes.enumerated()), id: \.offset) { _, item in
                            HearthCard {
                                Text(item.kind == "quote" ? "“\(item.content)”" : item.content)
                                    .hearthFont(.body)
                                    .foregroundStyle(HearthColor.textPrimary)
                            }
                        }
                    }
                }

                let photoCount = (entry.evidence ?? []).filter { $0.kind == "photo" }.count
                if photoCount > 0 {
                    Label(photoCount == 1 ? "1 photo" : "\(photoCount) photos", systemImage: "photo")
                        .hearthFont(.meta)
                        .foregroundStyle(HearthColor.textSecondary)
                }
            }
            .padding(HearthSpacing.xl)
            .hearthReadableWidth()
        }
        .hearthScreenBackground()
        .navigationBarTitleDisplayMode(.inline)
    }
}
