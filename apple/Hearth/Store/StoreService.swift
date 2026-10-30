import Foundation
import StoreKit

/// StoreKit 2 for premium packs (native plan v2.1 §4.1).
///
/// The rules that make this safe:
/// - Nothing unlocks locally. Every transaction goes to the server, which
///   verifies Apple's signature and writes the entitlement; `ownedPackIds`
///   comes from `/api/entitlements`.
/// - `finish()` happens only once the server has given a final answer. Until
///   then StoreKit redelivers the transaction via `Transaction.updates` /
///   `Transaction.unfinished`, which is the retry mechanism.
/// - Purchases carry the family UUID as `appAccountToken`, so the server can
///   refuse a transaction minted for a different Hearth account.
@Observable
final class StoreService {
    enum PurchaseOutcome: Equatable {
        case purchased
        case alreadyOwned
        /// Ask to Buy or Strong Customer Authentication; arrives later via updates.
        case pending
        case cancelled
        /// Apple charged, Hearth hasn't confirmed yet; it will retry on its own.
        case awaitingConfirmation
        case failed(String)
    }

    /// Indirection over StoreKit's purchase call. Views pass SwiftUI's
    /// `@Environment(\.purchase)` (which knows the window scene); tests call
    /// `product.purchase(options:)` directly.
    typealias PurchaseAction = (Product, Set<Product.PurchaseOption>) async throws -> Product.PurchaseResult

    private(set) var products: [String: Product] = [:]
    private(set) var ownedPackIds: Set<String> = []
    private(set) var isRestoring = false

    private let server: EntitlementServer
    @ObservationIgnored private var updatesTask: Task<Void, Never>?

    init(server: EntitlementServer) {
        self.server = server
    }

    /// Call once at launch, before any purchase UI shows.
    func start() {
        guard updatesTask == nil else { return }
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                await self?.deliver(update)
            }
        }
        Task { await processUnfinished() }
    }

    func stop() {
        updatesTask?.cancel()
        updatesTask = nil
    }

    func loadProducts(ids: [String]) async {
        let missing = ids.filter { products[$0] == nil }
        guard !missing.isEmpty, let loaded = try? await Product.products(for: missing) else { return }
        for product in loaded {
            products[product.id] = product
        }
    }

    func refreshOwnership() async {
        if let owned = try? await server.ownedPackIds() {
            ownedPackIds = owned
        }
    }

    /// Ownership belongs to the signed-in family; drop it on sign-out.
    func clearOwnership() {
        ownedPackIds = []
    }

    func isOwned(sanityPackId: String) -> Bool {
        ownedPackIds.contains(sanityPackId)
    }

    func purchase(_ product: Product, using action: PurchaseAction) async -> PurchaseOutcome {
        let familyId: UUID
        do {
            familyId = try await server.familyId()
        } catch {
            return .failed("Hearth needs a connection to start a purchase.")
        }

        let result: Product.PurchaseResult
        do {
            result = try await action(product, [.appAccountToken(familyId)])
        } catch {
            return .failed(error.localizedDescription)
        }

        switch result {
        case .success(let verification):
            switch await deliver(verification) {
            case .granted: return .purchased
            case .alreadyOwned: return .alreadyOwned
            case .rejected: return .failed("Hearth couldn't confirm this App Store purchase. Contact Hearth support and we'll sort it out.")
            case .retryLater: return .awaitingConfirmation
            }
        case .pending:
            return .pending
        case .userCancelled:
            return .cancelled
        @unknown default:
            return .failed("The App Store returned something unexpected.")
        }
    }

    /// Restore Purchases (Guideline 3.1.1): re-sync with the App Store and
    /// resend every current entitlement, then re-read ownership.
    func restore() async {
        isRestoring = true
        defer { isRestoring = false }
        try? await AppStore.sync()
        for await entitlement in Transaction.currentEntitlements {
            await deliver(entitlement, finishing: false)
        }
        await processUnfinished()
        await refreshOwnership()
    }

    /// Retries anything StoreKit still holds: a purchase made while the server
    /// was unreachable, or one whose `finish()` didn't land (the local StoreKit
    /// test environment drops a finish issued the instant a purchase returns).
    /// Resending is safe because the server's answer is idempotent. Runs at
    /// launch and on every return to the foreground.
    func processUnfinished() async {
        for await transaction in Transaction.unfinished {
            await deliver(transaction)
        }
    }

    @discardableResult
    private func deliver(_ verification: VerificationResult<Transaction>, finishing: Bool = true) async -> TransactionReceipt {
        // The server is the verifier; send the JWS even when the local check
        // fails, and let the server reject it. Locally unverified transactions
        // never unlock anything here.
        let receipt = await server.submit(signedTransaction: verification.jwsRepresentation)
        switch receipt {
        case .granted(let packId):
            if let packId { ownedPackIds.insert(packId) }
            await refreshOwnership()
            if finishing { await verification.unsafePayloadValue.finish() }
        case .alreadyOwned, .rejected:
            if finishing { await verification.unsafePayloadValue.finish() }
        case .retryLater:
            break
        }
        return receipt
    }
}
