import SwiftUI
import UIKit

/// Native Quick Log (native plan v2, N0). Every save goes through the outbox,
/// so it works the same online and offline. N2 replaces this with the full
/// Logger (Notice → Confirm, photos, voice).
struct QuickLogView: View {
    @Environment(AppServices.self) private var services
    @State private var draft = QuickLogDraft()
    @State private var confirmation: String?
    @FocusState private var focusedField: Field?

    private enum Field { case title, notes }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: HearthSpacing.xl) {
                    whoSection
                    whatSection
                    whenSection
                    if let confirmation {
                        Label(confirmation, systemImage: "checkmark.circle.fill")
                            .hearthFont(.label)
                            .foregroundStyle(HearthColor.sageText)
                            .padding(HearthSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(HearthColor.sageMuted, in: .rect(cornerRadius: HearthRadius.md))
                            .transition(.opacity)
                    }
                    Button("Save entry", action: save)
                        .buttonStyle(.hearthPrimary)
                        .disabled(!draft.canSave)
                        .keyboardShortcut(.return, modifiers: .command)
                }
                .padding(HearthSpacing.xl)
                .hearthReadableWidth()
            }
            .scrollDismissesKeyboard(.interactively)
            .hearthScreenBackground()
            .navigationTitle("Log")
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { focusedField = nil }
                }
            }
        }
    }

    private var whoSection: some View {
        VStack(alignment: .leading, spacing: HearthSpacing.md) {
            Text("Who").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
            if services.family.learners.isEmpty {
                Text("Your learners will appear here once Hearth has connected.")
                    .hearthFont(.body)
                    .foregroundStyle(HearthColor.textSecondary)
            }
            FlowLayout {
                ForEach(services.family.learners) { learner in
                    LearnerChip(learner: learner, isSelected: draft.learnerIds.contains(learner.id)) {
                        draft.toggle(learner.id)
                    }
                }
            }
        }
    }

    private var whatSection: some View {
        VStack(alignment: .leading, spacing: HearthSpacing.md) {
            Text("What happened").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
            TextField("A short title, like “Measured the garden beds”", text: $draft.title, axis: .vertical)
                .hearthFont(.cardTitle)
                .focused($focusedField, equals: .title)
                .submitLabel(.next)
                .onSubmit { focusedField = .notes }
                .hearthField(isFocused: focusedField == .title)
            TextField("What did you notice? (optional)", text: $draft.notes, axis: .vertical)
                .hearthFont(.body)
                .lineLimit(4...12)
                .focused($focusedField, equals: .notes)
                .hearthField(isFocused: focusedField == .notes)
        }
    }

    private var whenSection: some View {
        DatePicker(selection: $draft.date, in: ...Date.now, displayedComponents: .date) {
            Text("When").hearthFont(.overline).foregroundStyle(HearthColor.textMuted)
        }
    }

    private func save() {
        guard let payload = draft.payload() else { return }
        services.outbox.enqueue(payload)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        draft = QuickLogDraft()
        focusedField = nil
        Task {
            let result = await services.flushOutbox()
            withAnimation(HearthMotion.standard()) {
                confirmation = result.remaining > 0 || !services.isOnline
                    ? "Saved on this device. It will sync when you're back online."
                    : "Saved to your family's story."
            }
        }
    }
}

struct QuickLogDraft: Equatable {
    var title = ""
    var notes = ""
    var date = Date.now
    var learnerIds: [String] = []

    var canSave: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    mutating func toggle(_ learnerId: String) {
        if let index = learnerIds.firstIndex(of: learnerId) {
            learnerIds.remove(at: index)
        } else {
            learnerIds.append(learnerId)
        }
    }

    func payload() -> NewEntryPayload? {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return nil }
        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        return NewEntryPayload(
            title: trimmedTitle,
            description: trimmedNotes.isEmpty ? nil : trimmedNotes,
            dateOccurred: HearthDate.day.string(from: date),
            learnerIds: learnerIds
        )
    }
}

private extension View {
    func hearthField(isFocused: Bool) -> some View {
        padding(HearthSpacing.md)
            .foregroundStyle(HearthColor.textPrimary)
            .background(HearthColor.surfaceInput, in: .rect(cornerRadius: HearthRadius.md))
            .overlay {
                RoundedRectangle(cornerRadius: HearthRadius.md)
                    .strokeBorder(isFocused ? HearthColor.borderFocus : HearthColor.borderSubtle)
            }
            .animation(HearthMotion.standard(), value: isFocused)
    }
}
