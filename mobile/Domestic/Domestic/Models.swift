import Foundation
import SwiftUI

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
    let rating: Double?
    let subscriptionPlan: String?
    let subscriptionExpiresAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, role, rating
        case allergyInfo = "allergy_info"
        case hasCriminalRecord = "has_criminal_record"
        case createdAt = "created_at"
        case location
        case hourlyRate = "hourly_rate"
        case skills
        case photoURL = "photo_url"
        case bio
        case subscriptionPlan = "subscription_plan"
        case subscriptionExpiresAt = "subscription_expires_at"
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

// MARK: - Subscription Models
struct PlanDetail: Codable, Identifiable {
    let id: String
    let name: String
    let price: Double
    let features: [String]
}

struct UserSubscriptionInfo: Codable {
    let plan: String?
    let expiresAt: String?
    
    enum CodingKeys: String, CodingKey {
        case plan
        case expiresAt = "expires_at"
    }
}

// MARK: - Notification Models
struct NotificationItem: Identifiable, Codable {
    let id: Int
    let userId: Int
    let title: String
    let message: String
    let isRead: Bool
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id, title, message
        case userId = "user_id"
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}

struct NotificationListResponse: Codable {
    let notifications: [NotificationItem]
    let unreadCount: Int
    
    enum CodingKeys: String, CodingKey {
        case notifications
        case unreadCount = "unread_count"
    }
}

// MARK: - Notifications ListView
struct NotificationsListView: View {
    let accentColor: Color
    @Binding var unreadCount: Int
    
    @AppStorage("token") var token: String?
    @State private var notifications: [NotificationItem] = []
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    @State private var timer: Timer? = nil
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                if isLoading && notifications.isEmpty {
                    ProgressView("Yükleniyor...")
                        .progressViewStyle(CircularProgressViewStyle(tint: accentColor))
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.orange)
                        Text(error)
                            .font(.headline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        Button(action: { Task { await fetchNotifications() } }) {
                            Text("Yeniden Dene")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding()
                                .background(accentColor)
                                .cornerRadius(10)
                        }
                    }
                } else if notifications.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "bell.slash.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary.opacity(0.5))
                        Text("Bildiriminiz bulunmuyor.")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List {
                        ForEach(notifications) { item in
                            NotificationRow(item: item, accentColor: accentColor) {
                                if !item.isRead {
                                    Task { await markAsRead(item.id) }
                                }
                            }
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("Bildirimler")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if unreadCount > 0 {
                        Button("Tümünü Oku") {
                            Task { await markAllAsRead() }
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(accentColor)
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { Task { await fetchNotifications() } }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(accentColor)
                    }
                }
            }
            .task {
                await fetchNotifications()
                startTimer()
            }
            .onDisappear {
                stopTimer()
            }
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task { await fetchNotifications() }
        }
    }
    
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
    
    private func fetchNotifications() async {
        guard let tokenValue = token else { return }
        
        if notifications.isEmpty {
            await MainActor.run { isLoading = true }
        }
        
        do {
            let res = try await NetworkManager.shared.fetchNotifications(token: tokenValue)
            await MainActor.run {
                self.notifications = res.notifications
                self.unreadCount = res.unreadCount
                self.isLoading = false
                self.errorMessage = nil
            }
        } catch {
            print("❌ Failed to fetch notifications: \(error)")
            await MainActor.run {
                self.isLoading = false
                if self.notifications.isEmpty {
                    self.errorMessage = "Bildirimler yüklenirken bir hata oluştu."
                }
            }
        }
    }
    
    private func markAsRead(_ id: Int) async {
        guard let tokenValue = token else { return }
        do {
            _ = try await NetworkManager.shared.markNotificationRead(id: id, token: tokenValue)
            await MainActor.run {
                if let index = notifications.firstIndex(where: { $0.id == id }) {
                    let updatedItem = NotificationItem(
                        id: notifications[index].id,
                        userId: notifications[index].userId,
                        title: notifications[index].title,
                        message: notifications[index].message,
                        isRead: true,
                        createdAt: notifications[index].createdAt
                    )
                    notifications[index] = updatedItem
                }
                unreadCount = max(0, unreadCount - 1)
            }
        } catch {
            print("❌ Failed to mark notification read: \(error)")
        }
    }
    
    private func markAllAsRead() async {
        guard let tokenValue = token else { return }
        do {
            try await NetworkManager.shared.markAllNotificationsRead(token: tokenValue)
            await MainActor.run {
                self.notifications = self.notifications.map { item in
                    NotificationItem(
                        id: item.id,
                        userId: item.userId,
                        title: item.title,
                        message: item.message,
                        isRead: true,
                        createdAt: item.createdAt
                    )
                }
                self.unreadCount = 0
            }
        } catch {
            print("❌ Failed to mark all notifications read: \(error)")
        }
    }
}

struct NotificationRow: View {
    let item: NotificationItem
    let accentColor: Color
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 15) {
                if !item.isRead {
                    Rectangle()
                        .fill(Color(red: 30/255, green: 58/255, blue: 138/255))
                        .frame(width: 4)
                        .cornerRadius(2)
                        .padding(.vertical, 8)
                } else {
                    Spacer()
                        .frame(width: 4)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(item.title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.primary)
                        Spacer()
                        if !item.isRead {
                            Circle()
                                .fill(accentColor)
                                .frame(width: 8, height: 8)
                        }
                    }
                    
                    Text(item.message)
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)
                    
                    Text(formatDateString(item.createdAt))
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.gray)
                        .padding(.top, 2)
                }
                .padding(.vertical, 12)
                .padding(.trailing, 12)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatDateString(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        
        let formats = [
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss"
        ]
        
        var date: Date? = nil
        for format in formats {
            formatter.dateFormat = format
            if let d = formatter.date(from: dateStr) {
                date = d
                break
            }
        }
        
        if let date = date {
            formatter.dateFormat = "dd.MM.yyyy HH:mm"
            return formatter.string(from: date)
        }
        
        return dateStr
    }
}

