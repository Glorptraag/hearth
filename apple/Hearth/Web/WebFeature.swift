import Foundation

/// A web-homed surface hosted inside native chrome (native plan v2 §3).
struct WebFeature: Hashable, Identifiable, Sendable {
    let title: String
    let path: String
    let symbol: String
    var summary: String?

    var id: String { path }

    static let planner = WebFeature(title: "Weekly Planner", path: "/planner", symbol: "calendar", summary: "Sketch the week ahead")
    static let moduleBuilder = WebFeature(title: "Module Builder", path: "/build/modules", symbol: "square.stack.3d.up", summary: "Shape your own modules")
    static let badgeCreator = WebFeature(title: "Badge Creator", path: "/build/badges", symbol: "rosette", summary: "Design family badges")

    static let capabilities = WebFeature(title: "Capabilities", path: "/our-story/capabilities", symbol: "sparkles", summary: "Threads your children are growing")
    static let library = WebFeature(title: "Library", path: "/library", symbol: "books.vertical", summary: "Modules and packs you've saved")
    static let marketplace = WebFeature(title: "Marketplace", path: "/explore/marketplace", symbol: "storefront", summary: "Browse packs")
    static let activities = WebFeature(title: "Activity Discovery", path: "/explore/activities", symbol: "safari", summary: "Find something to try today")

    static let constellation = WebFeature(title: "Constellation", path: "/constellation", symbol: "point.3.connected.trianglepath.dotted")
    static let reports = WebFeature(title: "Reports", path: "/our-story/report", symbol: "doc.text")
    static let portfolio = WebFeature(title: "Portfolio", path: "/our-story/portfolio", symbol: "photo.on.rectangle")
    static let familySettings = WebFeature(title: "Family settings", path: "/settings", symbol: "person.2")
    static let notifications = WebFeature(title: "Notifications", path: "/notifications", symbol: "bell")
    static let privacy = WebFeature(title: "Privacy", path: "/privacy", symbol: "hand.raised")
    static let terms = WebFeature(title: "Terms", path: "/terms", symbol: "doc.plaintext")

    static let planHub = [planner, moduleBuilder, badgeCreator]
    static let exploreHub = [activities, library, marketplace, capabilities]
}
