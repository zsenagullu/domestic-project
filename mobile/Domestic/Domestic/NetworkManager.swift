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
}
