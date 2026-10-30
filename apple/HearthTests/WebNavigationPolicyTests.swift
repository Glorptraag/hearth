import Foundation
import Testing
@testable import Hearth

struct WebNavigationPolicyTests {
    let policy = WebNavigationPolicy(origin: URL(string: "https://www.hearth-lms.com")!)

    private func decide(_ string: String, mainFrame: Bool = true) -> WebNavigationPolicy.Decision {
        policy.decide(URL(string: string)!, isMainFrame: mainFrame)
    }

    @Test func hearthPagesStayInApp() {
        #expect(decide("https://www.hearth-lms.com/planner") == .allow)
        #expect(decide("https://www.hearth-lms.com/our-story/report?term=3") == .allow)
    }

    @Test func operatorSurfacesNeverRenderInApp() {
        #expect(decide("https://www.hearth-lms.com/admin/content/qa") == .openExternally)
        #expect(decide("https://www.hearth-lms.com/studio") == .openExternally)
    }

    @Test func signInRedirectBecomesHandoffToTheSamePage() {
        let decision = decide("https://www.hearth-lms.com/sign-in?redirect_url=https%3A%2F%2Fwww.hearth-lms.com%2Fplanner%3Fweek%3D2")
        #expect(decision == .handoff(next: "/planner?week=2"))
    }

    @Test func signInRedirectToAnotherHostGoesHome() {
        let decision = decide("https://www.hearth-lms.com/sign-in?redirect_url=https%3A%2F%2Fevil.example%2Fsteal")
        #expect(decision == .handoff(next: "/dashboard"))
    }

    @Test func externalLinksLeaveTheApp() {
        #expect(decide("https://australiancurriculum.edu.au/") == .openExternally)
        #expect(decide("mailto:hello@hearth-lms.com") == .openExternally)
        #expect(decide("https://hearth-lms.com/planner") == .openExternally) // apex is a different origin
    }

    @Test func clerkAndSubframesLoadInPlace() {
        #expect(decide("https://clerk.hearth-lms.com/v1/client") == .allow)
        #expect(decide("https://fond-bee-12.clerk.accounts.dev/sign-in") == .allow)
        #expect(decide("https://www.youtube.com/embed/x", mainFrame: false) == .allow)
    }

    @Test(arguments: ["/planner", "/our-story/report?x=1"])
    func relativePathsAreAccepted(path: String) {
        #expect(WebNavigationPolicy.safeRelativePath(path) == path)
    }

    @Test(arguments: ["//evil.example", "https://evil.example", "planner", "/\\evil.example", ""])
    func openRedirectShapesAreRejected(path: String) {
        #expect(WebNavigationPolicy.safeRelativePath(path) == nil)
    }
}
