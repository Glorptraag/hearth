import Foundation
import StoreKit
import StoreKitTest
import Testing
@testable import Hearth

/// Purchase paths against the local `Store/Hearth.storekit` configuration.
/// No App Store Connect setup is needed. The fake server stands in for
/// `/api/iap/apple/*` (N3b) so each server answer can be forced.
@Suite(.serialized)
struct StoreTests {
    static let productID = "com.hearthlms.app.pack.sample"
    static let packID = "pack.sample"

    final class FakeServer: EntitlementServer {
        var receipt: TransactionReceipt
        var owned: Set<String> = []
        private(set) var submissions: [String] = []
        let family = UUID()

        init(receipt: TransactionReceipt) {
            self.receipt = receipt
        }

        func submit(signedTransaction: String) async -> TransactionReceipt {
            submissions.append(signedTransaction)
            if case .granted(let packId?) = receipt { owned.insert(packId) }
            return receipt
        }

        func ownedPackIds() async throws -> Set<String> { owned }
        func familyId() async throws -> UUID { family }
    }

    private func makeSession() throws -> SKTestSession {
        let session = try SKTestSession(configurationFileNamed: "Hearth")
        session.resetToDefaultState()
        session.disableDialogs = true
        session.clearTransactions()
        return session
    }

    private func product(_ store: StoreService) async throws -> Product {
        await store.loadProducts(ids: [Self.productID])
        return try #require(store.products[Self.productID])
    }

    private func unfinishedCount() async -> Int {
        var count = 0
        for await _ in Transaction.unfinished { count += 1 }
        return count
    }

    /// The local test session can drop a `finish()` issued the instant a
    /// purchase returns. The app recovers by redelivering unfinished
    /// transactions (launch and foreground), so the property under test is
    /// "finished once the app has had its retry", not "finished on the first call".
    private func unfinishedAfterRetry(_ store: StoreService) async -> Int {
        await store.processUnfinished()
        return await unfinishedCount()
    }

    private let directPurchase: StoreService.PurchaseAction = { product, options in
        try await product.purchase(options: options)
    }

    @Test func loadsAppleLocalisedPrice() async throws {
        _ = try makeSession()
        let store = StoreService(server: FakeServer(receipt: .retryLater))
        let product = try await product(store)
        #expect(product.type == .nonConsumable)
        #expect(!product.displayPrice.isEmpty)
    }

    @Test func grantedPurchaseUnlocksAndFinishes() async throws {
        _ = try makeSession()
        let server = FakeServer(receipt: .granted(sanityPackId: Self.packID))
        let store = StoreService(server: server)

        let outcome = await store.purchase(try await product(store), using: directPurchase)

        #expect(outcome == .purchased)
        #expect(store.isOwned(sanityPackId: Self.packID))
        #expect(server.submissions.count == 1)
        #expect(await unfinishedAfterRetry(store) == 0)
    }

    @Test func purchaseCarriesTheFamilyAsAppAccountToken() async throws {
        _ = try makeSession()
        let server = FakeServer(receipt: .granted(sanityPackId: Self.packID))
        let store = StoreService(server: server)

        _ = await store.purchase(try await product(store), using: directPurchase)

        var token: UUID?
        for await result in Transaction.all {
            if case .verified(let transaction) = result, transaction.productID == Self.productID {
                token = transaction.appAccountToken
            }
        }
        #expect(token == server.family)
    }

    @Test func serverOutageKeepsTheTransactionForRetry() async throws {
        _ = try makeSession()
        let server = FakeServer(receipt: .retryLater)
        let store = StoreService(server: server)

        let outcome = await store.purchase(try await product(store), using: directPurchase)

        #expect(outcome == .awaitingConfirmation)
        #expect(!store.isOwned(sanityPackId: Self.packID))
        #expect(await unfinishedCount() == 1)

        // Server recovers: the unfinished transaction is delivered and finished.
        server.receipt = .granted(sanityPackId: Self.packID)
        await store.processUnfinished()
        #expect(store.isOwned(sanityPackId: Self.packID))
        #expect(await unfinishedAfterRetry(store) == 0)
    }

    @Test func rejectedTransactionFinishesWithoutUnlocking() async throws {
        _ = try makeSession()
        let store = StoreService(server: FakeServer(receipt: .rejected))

        let outcome = await store.purchase(try await product(store), using: directPurchase)

        guard case .failed = outcome else {
            Issue.record("Expected failure, got \(outcome)")
            return
        }
        #expect(!store.isOwned(sanityPackId: Self.packID))
        #expect(await unfinishedAfterRetry(store) == 0)
    }

    @Test func askToBuyIsPending() async throws {
        let session = try makeSession()
        session.askToBuyEnabled = true
        let store = StoreService(server: FakeServer(receipt: .granted(sanityPackId: Self.packID)))

        let outcome = await store.purchase(try await product(store), using: directPurchase)

        #expect(outcome == .pending)
        #expect(!store.isOwned(sanityPackId: Self.packID))
    }

    @Test(arguments: [
        (201, TransactionReceipt.granted(sanityPackId: "p")),
        (200, .granted(sanityPackId: "p")),
        (409, .alreadyOwned),
        (400, .rejected),
        (403, .rejected),
        (422, .rejected),
        (401, .retryLater),
        (404, .retryLater),
        (429, .retryLater),
        (500, .retryLater),
    ])
    func receiptPolicyOnlyFinishesOnFinalAnswers(status: Int, expected: TransactionReceipt) {
        #expect(ReceiptPolicy.receipt(forStatus: status, sanityPackId: "p") == expected)
    }
}
