import Foundation
import Combine

class NetworkManager {
    static let shared = NetworkManager()
    private let baseURL = "http://127.0.0.1:8000/api/v1"
    
    private init() {}
    
    func fetchJobs(token: String? = nil) async throws -> [Job] {
        guard let url = URL(string: "\(baseURL)/jobs/") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        // If the dates are returned in a specific string format you could setup date decoding configs here
        let jobs = try decoder.decode([Job].self, from: data)
        return jobs
    }
    
    func createJob(title: String, description: String, location: String?, houseSize: String?, price: Double?, serviceType: String, token: String) async throws -> Job {
        guard let url = URL(string: "\(baseURL)/jobs/") else {
            throw URLError(.badURL)
        }
        
        var jobData: [String: Any] = [
            "title": title,
            "description": description,
            "service_type": serviceType
        ]
        
        if let location = location { jobData["location"] = location }
        if let houseSize = houseSize { jobData["house_size"] = houseSize }
        if let price = price { jobData["price"] = price }
        
        guard let body = try? JSONSerialization.data(withJSONObject: jobData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let newJob = try JSONDecoder().decode(Job.self, from: data)
        return newJob
    }

    func createOffer(jobId: Int, offeredPrice: Double, message: String, estimatedTime: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/offers/") else {
            throw URLError(.badURL)
        }
        
        let offerData: [String: Any] = [
            "job_id": jobId,
            "offered_price": offeredPrice,
            "message": message,
            "estimated_time": estimatedTime
        ]
        
        guard let body = try? JSONSerialization.data(withJSONObject: offerData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }

    func fetchMyOffers(token: String) async throws -> [Offer] {
        guard let url = URL(string: "\(baseURL)/offers/user/me") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode([Offer].self, from: data)
    }

    func updateOfferStatus(offerId: Int, status: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/offers/\(offerId)/status") else {
            throw URLError(.badURL)
        }
        
        let statusData = ["status": status]
        guard let body = try? JSONSerialization.data(withJSONObject: statusData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
    
    func validateToken(_ token: String) async throws {
        guard let url = URL(string: "\(baseURL)/users/me") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if httpResponse.statusCode != 200 {
            throw URLError(.userAuthenticationRequired)
        }
    }
    
    func testConnection() async {
        guard let url = URL(string: "http://host.docker.internal:8000/health") else {
            print("❌ Invalid URL")
            return
        }
        
        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            if let httpResponse = response as? HTTPURLResponse {
                print("✅ Connection Test Result: \(httpResponse.statusCode)")
            }
        } catch {
            print("❌ Connection Test Error: \(error.localizedDescription)")
        }
    }
    
    func analyzeVoiceCommand(text: String, token: String) async throws -> AIAnalysisResult {
        guard let url = URL(string: "\(baseURL)/ai/analyze-voice") else {
            throw URLError(.badURL)
        }
        
        let requestData = ["text": text]
        guard let body = try? JSONSerialization.data(withJSONObject: requestData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let wrapper = try JSONDecoder().decode(AIAnalysisResponse.self, from: data)
        guard let rawJsonData = wrapper.rawJson.data(using: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        let result = try JSONDecoder().decode(AIAnalysisResult.self, from: rawJsonData)
        return result
    }
    
    func fetchWorkerMatches(location: String?, houseSize: String?, token: String) async throws -> [WorkerMatch] {
        var urlComponents = URLComponents(string: "\(baseURL)/users/match")!
        
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "service_type", value: "DIRECT_BOOKING")
        ]
        
        if let location = location {
            queryItems.append(URLQueryItem(name: "location", value: location))
        }
        if let houseSize = houseSize {
            queryItems.append(URLQueryItem(name: "house_size", value: houseSize))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode([WorkerMatch].self, from: data)
    }
    
    func fetchUserProfile(token: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/users/me") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    func updateUserProfile(location: String?, hourlyRate: Double?, skills: [String]?, bio: String?, token: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/users/me") else {
            throw URLError(.badURL)
        }
        
        var profileData: [String: Any] = [:]
        if let location = location { profileData["location"] = location }
        if let hourlyRate = hourlyRate { profileData["hourly_rate"] = hourlyRate }
        if let skills = skills { profileData["skills"] = skills }
        if let bio = bio { profileData["bio"] = bio }
        
        guard let body = try? JSONSerialization.data(withJSONObject: profileData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    func uploadProfilePhoto(base64Photo: String, token: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/users/me/photo") else {
            throw URLError(.badURL)
        }
        
        let payload = ["photo": base64Photo]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    func fetchProvinces() async throws -> [TurkeyAPIProvince] {
        guard let url = URL(string: "https://turkiyeapi.dev/api/v1/provinces") else {
            throw URLError(.badURL)
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let decoded = try JSONDecoder().decode(TurkeyAPIProvincesResponse.self, from: data)
        if decoded.status == "OK" {
            return decoded.data.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        } else {
            throw URLError(.badServerResponse)
        }
    }
    
    func fetchDistricts(provinceId: Int) async throws -> [TurkeyAPIDistrict] {
        guard let url = URL(string: "https://turkiyeapi.dev/api/v1/provinces/\(provinceId)") else {
            throw URLError(.badURL)
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let decoded = try JSONDecoder().decode(TurkeyAPIDistrictsResponse.self, from: data)
        if decoded.status == "OK" {
            return decoded.data.districts.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        } else {
            throw URLError(.badServerResponse)
        }
    }
    
    func createDirectRequest(workerId: Int, jobId: Int, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/direct-requests/") else {
            throw URLError(.badURL)
        }
        
        let payload: [String: Any] = [
            "worker_id": workerId,
            "job_id": jobId
        ]
        
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
    
    func fetchIncomingRequests(token: String) async throws -> [DirectRequest] {
        guard let url = URL(string: "\(baseURL)/direct-requests/worker/me") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode([DirectRequest].self, from: data)
    }
    
    func updateDirectRequestStatus(requestId: Int, status: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/direct-requests/\(requestId)/status") else {
            throw URLError(.badURL)
        }
        
        let payload = ["status": status]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
    
    func createReview(offerId: Int, workerId: Int, rating: Int, comment: String?, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/reviews/") else {
            throw URLError(.badURL)
        }
        
        var payload: [String: Any] = [
            "offer_id": offerId,
            "worker_id": workerId,
            "rating": rating
        ]
        if let comment = comment {
            payload["comment"] = comment
        }
        
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
    
    func fetchJobById(jobId: Int, token: String) async throws -> Job {
        guard let url = URL(string: "\(baseURL)/jobs/\(jobId)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(Job.self, from: data)
    }
    
    func updateJob(jobId: Int, title: String, description: String, location: String?, houseSize: String?, price: Double?, token: String) async throws -> Job {
        guard let url = URL(string: "\(baseURL)/jobs/\(jobId)") else {
            throw URLError(.badURL)
        }
        
        var jobData: [String: Any] = [
            "title": title,
            "description": description
        ]
        
        if let location = location { jobData["location"] = location }
        if let houseSize = houseSize { jobData["house_size"] = houseSize }
        if let price = price { jobData["price"] = price }
        
        guard let body = try? JSONSerialization.data(withJSONObject: jobData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(Job.self, from: data)
    }
    
    func updateJobStatus(jobId: Int, status: String, token: String) async throws -> Job {
        guard let url = URL(string: "\(baseURL)/jobs/\(jobId)/status") else {
            throw URLError(.badURL)
        }
        
        let statusData = ["status": status]
        guard let body = try? JSONSerialization.data(withJSONObject: statusData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(Job.self, from: data)
    }
    
    func fetchWorkerStats(workerId: Int) async throws -> WorkerStats {
        guard let url = URL(string: "\(baseURL)/users/\(workerId)/stats") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(WorkerStats.self, from: data)
    }
    
    func fetchWorkerReviews(workerId: Int) async throws -> [Review] {
        guard let url = URL(string: "\(baseURL)/reviews/worker/\(workerId)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode([Review].self, from: data)
    }
    
    func fetchUserById(userId: Int) async throws -> User {
        guard let url = URL(string: "\(baseURL)/users/\(userId)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    func fetchSubscriptionPlans() async throws -> [PlanDetail] {
        guard let url = URL(string: "\(baseURL)/subscriptions/plans") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode([PlanDetail].self, from: data)
    }
    
    func fetchMyPlan(token: String) async throws -> UserSubscriptionInfo {
        guard let url = URL(string: "\(baseURL)/subscriptions/my-plan") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(UserSubscriptionInfo.self, from: data)
    }
    
    func subscribeToPlan(planId: String, token: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/subscriptions/subscribe") else {
            throw URLError(.badURL)
        }
        
        let payload = ["plan": planId]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(User.self, from: data)
    }
}

