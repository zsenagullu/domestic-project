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
    let location: String?
    let hourlyRate: Double?
    let skills: [String]?
    let photoURL: String?
    let bio: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, role
        case allergyInfo = "allergy_info"
        case hasCriminalRecord = "has_criminal_record"
        case createdAt = "created_at"
        case location
        case hourlyRate = "hourly_rate"
        case skills
        case photoURL = "photo_url"
        case bio
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
    let offers: [Offer]?
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, status, offers
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
    let job: Job? 
    let worker: User?
    let reviews: [Review]?
    
    enum CodingKeys: String, CodingKey {
        case id, status, job, message, worker, reviews
        case offeredPrice = "offered_price"
        case estimatedTime = "estimated_time"
        case jobId = "job_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

// MARK: - AI Analysis Models
struct AIAnalysisResponse: Codable {
    let rawJson: String
    
    enum CodingKeys: String, CodingKey {
        case rawJson = "raw_json"
    }
}

struct AIAnalysisResult: Codable {
    let location: String?
    let houseSize: String?
    let estimatedPrice: Double?
    let description: String?
    let serviceType: String?
    let cleaningType: String?
    let preferredDate: String?
    let hasPets: Bool?
    let hasAllergies: Bool?
    let specialNotes: String?
    
    enum CodingKeys: String, CodingKey {
        case location
        case houseSize = "house_size"
        case estimatedPrice = "estimated_price"
        case description
        case serviceType = "service_type"
        case cleaningType = "cleaning_type"
        case preferredDate = "preferred_date"
        case hasPets = "has_pets"
        case hasAllergies = "has_allergies"
        case specialNotes = "special_notes"
    }
}

// MARK: - Worker Match Model
struct WorkerMatch: Codable, Identifiable {
    let id: Int
    let name: String
    let location: String?
    let hourlyRate: Double?
    let rating: Double?
    let skills: [String]?
    let photoURL: String?
    let bio: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, location, skills, rating, bio
        case hourlyRate = "hourly_rate"
        case photoURL = "photo_url"
    }
}

// MARK: - Turkey API Models
struct TurkeyAPIProvincesResponse: Codable {
    let status: String
    let data: [TurkeyAPIProvince]
}

struct TurkeyAPIProvince: Codable, Identifiable {
    let id: Int
    let name: String
}

struct TurkeyAPIDistrictsResponse: Codable {
    let status: String
    let data: TurkeyAPIDistrictData
}

struct TurkeyAPIDistrictData: Codable {
    let id: Int
    let name: String
    let districts: [TurkeyAPIDistrict]
}

struct TurkeyAPIDistrict: Codable, Identifiable {
    let id: Int
    let name: String
}

// MARK: - Direct Request Model
struct DirectRequest: Codable, Identifiable {
    let id: Int
    let customerId: Int
    let workerId: Int
    let jobId: Int
    let status: String
    let createdAt: String
    let customer: User?
    let job: Job?
    
    enum CodingKeys: String, CodingKey {
        case id, status, customer, job
        case customerId = "customer_id"
        case workerId = "worker_id"
        case jobId = "job_id"
        case createdAt = "created_at"
    }
}

// MARK: - Review Model
struct Review: Codable, Identifiable {
    let id: Int
    let offerId: Int
    let reviewerId: Int
    let workerId: Int
    let rating: Int
    let comment: String?
    let createdAt: String
    let reviewer: User?
    
    enum CodingKeys: String, CodingKey {
        case id, rating, comment, reviewer
        case offerId = "offer_id"
        case reviewerId = "reviewer_id"
        case workerId = "worker_id"
        case createdAt = "created_at"
    }
}

// MARK: - Worker Stats Model
struct WorkerStats: Codable {
    let completedJobsCount: Int
    
    enum CodingKeys: String, CodingKey {
        case completedJobsCount = "completed_jobs_count"
    }
}

