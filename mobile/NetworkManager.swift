import Foundation
import Combine

class NetworkManager {
    static let shared = NetworkManager()
    private let baseURL = "http://localhost:8000/api/v1"
    
    private init() {}
    
    func fetchJobs() async throws -> [Job] {
        guard let url = URL(string: "\(baseURL)/jobs/") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add Bearer Token if needed
        // request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        // If the dates are returned in a specific string format you could setup date decoding configs here
        let jobs = try decoder.decode([Job].self, from: data)
        return jobs
    }
    
    func createJob(title: String, description: String, photoURL: String? = nil) async throws -> Job {
        guard let url = URL(string: "\(baseURL)/jobs/") else {
            throw URLError(.badURL)
        }
        
        let jobData: [String: Any] = [
            "title": title,
            "description": description,
            "photo_url": photoURL ?? NSNull()
        ]
        
        guard let body = try? JSONSerialization.data(withJSONObject: jobData) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        request.httpBody = body
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let newJob = try JSONDecoder().decode(Job.self, from: data)
        return newJob
    }
}
