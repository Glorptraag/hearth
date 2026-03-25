// User Schema
const UserSchema = {
  _id: ObjectId,
  email: String,
  password: String, // Hashed
  role: String, // "admin", "facilitator", "learningDesigner", "learner"
  firstName: String,
  lastName: String,
  createdAt: Date,
  updatedAt: Date
}

// Family Schema
const FamilySchema = {
  _id: ObjectId,
  name: String,
  primaryFacilitatorId: ObjectId, // References User
  members: [
    {
      userId: ObjectId, // References User
      role: String, // "facilitator", "learner"
      joinedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// LearnerProfile Schema (extended details for learner users)
const LearnerProfileSchema = {
  _id: ObjectId,
  userId: ObjectId, // References User
  familyId: ObjectId, // References Family
  dateOfBirth: Date,
  grade: String, // Or equivalent measure
  learningPreferences: {
    preferredSubjects: [String],
    learningStyle: String,
    accommodations: [String]
  },
  createdAt: Date,
  updatedAt: Date
}

// Badge Schema
const BadgeSchema = {
  _id: ObjectId,
  name: String,
  description: String,
  imageUrl: String,
  criteria: String,
  skillsRepresented: [String],
  creatorId: ObjectId, // References User who created the badge
  createdAt: Date,
  updatedAt: Date,
  // Australian educational framework mappings
  frameworkMappings: [
    {
      frameworkType: String, // "PLO", "RPL", "ATAR"
      frameworkIdentifier: String, // Specific code in the framework
      description: String,
      level: String
    }
  ],
  isPublic: Boolean // Whether this badge is available platform-wide
}

// LearnerBadge Schema (connects badges to learners)
const LearnerBadgeSchema = {
  _id: ObjectId,
  badgeId: ObjectId, // References Badge
  learnerId: ObjectId, // References User
  issuerId: ObjectId, // References User who awarded the badge
  issueDate: Date,
  evidenceIds: [ObjectId], // References Evidence documents
  notes: String,
  visibility: String, // "private", "family", "public"
  createdAt: Date,
  updatedAt: Date
}

// Portfolio Schema
const PortfolioSchema = {
  _id: ObjectId,
  learnerId: ObjectId, // References User
  name: String,
  description: String,
  sections: [
    {
      title: String,
      description: String,
      items: [
        {
          type: String, // "badge", "evidence", "activity", "assessment"
          itemId: ObjectId, // References the respective collection
          notes: String,
          featured: Boolean
        }
      ]
    }
  ],
  visibility: String, // "private", "family", "public", "educational"
  createdAt: Date,
  updatedAt: Date
}

// Evidence Schema
const EvidenceSchema = {
  _id: ObjectId,
  learnerId: ObjectId, // References User
  title: String,
  description: String,
  evidenceType: String, // "document", "image", "video", "link", "assessment"
  mediaUrls: [String],
  documentUrl: String,
  linkUrl: String,
  dateCreated: Date,
  createdBy: ObjectId, // References User
  verifiedBy: [
    {
      userId: ObjectId, // References User
      verificationDate: Date,
      notes: String
    }
  ],
  // Connection to frameworks/standards
  frameworkMappings: [
    {
      frameworkType: String, // "PLO", "RPL", "ATAR" 
      frameworkIdentifier: String,
      description: String,
      level: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Activity Schema (for tracking real-world learning)
const ActivitySchema = {
  _id: ObjectId,
  title: String,
  description: String,
  activityType: String, // "field trip", "sports", "project", "reading", etc.
  location: String,
  startDate: Date,
  endDate: Date,
  duration: Number, // in minutes
  participants: [
    {
      learnerId: ObjectId, // References User
      role: String, // "participant", "leader", etc.
      notes: String
    }
  ],
  facilitatorId: ObjectId, // References User
  learningOutcomes: [String],
  evidenceIds: [ObjectId], // References Evidence
  // Framework mappings
  frameworkMappings: [
    {
      frameworkType: String, // "PLO", "RPL", "ATAR"
      frameworkIdentifier: String,
      description: String,
      level: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Assessment Group Schema
const AssessmentGroupSchema = {
  _id: ObjectId,
  name: String,
  description: String,
  creatorId: ObjectId, // References User
  members: [
    {
      userId: ObjectId, // References User
      role: String, // "facilitator", "learner"
      joinedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Forum Schema
const ForumSchema = {
  _id: ObjectId,
  title: String,
  description: String,
  creatorId: ObjectId, // References User
  // Three different content views based on role
  content: {
    learnerView: {
      sections: [
        {
          title: String,
          description: String,
          resources: [ObjectId], // References Resources
          activities: [ObjectId], // References Activities
          assessments: [ObjectId] // References Assessments
        }
      ]
    },
    designerView: {
      learningObjectives: [String],
      pedagogicalApproach: String,
      suggestedTimeframe: String,
      prerequisiteKnowledge: [String],
      designNotes: String,
      frameworkMappings: [
        {
          frameworkType: String,
          frameworkIdentifier: String,
          description: String,
          level: String
        }
      ]
    },
    facilitatorView: {
      guidanceNotes: [
        {
          sectionIndex: Number,
          notes: String,
          resources: [String]
        }
      ],
      suggestionScripts: [String],
      troubleshootingTips: [String],
      extensionIdeas: [String]
    }
  },
  members: [
    {
      userId: ObjectId, // References User
      role: String, // "designer", "facilitator", "learner"
      joinedAt: Date
    }
  ],
  // If this is a purchasable forum
  isPurchasable: Boolean,
  price: Number,
  creatorPaymentInfo: {
    name: String,
    credentials: String,
    bio: String,
    profileImageUrl: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Educational Framework Mapping Schema
const FrameworkSchema = {
  _id: ObjectId,
  name: String, // "PLO", "RPL", "ATAR"
  description: String,
  country: String,
  state: String,
  version: String,
  lastUpdated: Date,
  items: [
    {
      identifier: String, // The specific code/ID in the framework
      description: String,
      category: String,
      subcategory: String,
      level: String,
      ageRange: {
        min: Number,
        max: Number
      },
      keywords: [String]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
