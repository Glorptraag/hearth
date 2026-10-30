import Foundation

/// What the server said about a signed App Store transaction.
enum TransactionReceipt: Equatable, Sendable {
    /// Entitlement written (or already present for this transaction).
    case granted(sanityPackId: String?)
    /// The family already owns this pack through another purchase (e.g. web).
    case alreadyOwned
    /// The server will never accept this transaction (forged, wrong family,
    /// unknown product). Safe to finish so StoreKit stops redelivering it.
    case rejected
    /// Could not reach a decision: offline, signed out, server error, or a
    /// server without the N3b route yet. Do NOT finish; StoreKit redelivers.
    case retryLater
}

/// Ownership lives on the server (native plan v2.1, principle 5). This is the
/// app's only door to it, abstracted so purchase handling is testable.
protocol EntitlementServer: Sendable {
    func submit(signedTransaction: String) async -> TransactionReceipt
    func ownedPackIds() async throws -> Set<String>
    func familyId() async throws -> UUID
}

enum ReceiptPolicy {
    /// Maps the transactions route's status to a receipt. Only answers that are
    /// final for this transaction may lead to `finish()`; everything else keeps
    /// it queued, so a paid purchase is never dropped by an outage. 404 is
    /// deliberately "retry": it means the route isn't deployed yet, not that
    /// the purchase is bad.
    static func receipt(forStatus status: Int, sanityPackId: String?) -> TransactionReceipt {
        switch status {
        case 200..<300: .granted(sanityPackId: sanityPackId)
        case 409: .alreadyOwned
        case 400, 403, 422: .rejected
        default: .retryLater
        }
    }
}

struct APIEntitlementServer: EntitlementServer {
    let api: APIClient

    private struct SubmitBody: Encodable { let signedTransaction: String }
    private struct SubmitResponse: Decodable { let sanityPackId: String? }
    private struct Family: Decodable { let id: UUID }

    func submit(signedTransaction: String) async -> TransactionReceipt {
        do {
            let body = try JSONEncoder().encode(SubmitBody(signedTransaction: signedTransaction))
            let (status, data) = try await api.postRawWithBody("api/iap/apple/transactions", body: body)
            let packId = (try? JSONDecoder().decode(SubmitResponse.self, from: data))?.sanityPackId
            return ReceiptPolicy.receipt(forStatus: status, sanityPackId: packId)
        } catch {
            return .retryLater
        }
    }

    func ownedPackIds() async throws -> Set<String> {
        let ids: [String] = try await api.get("api/entitlements")
        return Set(ids)
    }

    func familyId() async throws -> UUID {
        let family: Family = try await api.get("api/family")
        return family.id
    }
}
