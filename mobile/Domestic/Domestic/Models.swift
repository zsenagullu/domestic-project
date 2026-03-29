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

enum ServiceType: String, Codable {
    case directBooking = "DIRECT_BOOKING"
    case marketplaceBidding = "MARKETPLACE_BIDDING"
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
    let serviceType: ServiceType?
    let location: String?
    let houseSize: String?
    let price: Double?
    let userId: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case photoURL = "photo_url"
        case serviceType = "service_type"
        case location, price
        case houseSize = "house_size"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

// MARK: - Offer Model
struct Offer: Codable, Identifiable {
    let id: Int
    let offeredPrice: Double
    let message: String
    let status: OfferStatus
    let estimatedTime: String?
    let jobId: Int
    let userId: Int
    let createdAt: String
    let job: Job? // Nested job info often returned in /offers/user/me
    
    enum CodingKeys: String, CodingKey {
        case id, status, job, message
        case offeredPrice = "offered_price"
        case estimatedTime = "estimated_time"
        case jobId = "job_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

