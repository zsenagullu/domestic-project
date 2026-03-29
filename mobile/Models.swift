import Foundation

// MARK: - API Response Wrapper
struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
    }
}

// MARK: - Enums
enum Role: String, Codable {
    case customer
    case worker
}

enum JobStatus: String, Codable {
    case open
    case inProgress = "in_progress"
    case completed
    case cancelled
}

enum OfferStatus: String, Codable {
    case pending
    case accepted
    case rejected
}

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let role: Role
    let allergyInfo: String?
    let hasCriminalRecord: Bool
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, role
        case allergyInfo = "allergy_info"
        case hasCriminalRecord = "has_criminal_record"
        case createdAt = "created_at"
    }
}

// MARK: - Job Model
struct Job: Codable, Identifiable {
    let id: Int
    let title: String
    let description: String
    let photoURL: String?
    let status: JobStatus
    let userId: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case photoURL = "photo_url"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

// MARK: - Offer Model
struct Offer: Codable, Identifiable {
    let id: Int
    let price: Int
    let description: String
    let status: OfferStatus
    let jobId: Int
    let userId: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, price, description, status
        case jobId = "job_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
