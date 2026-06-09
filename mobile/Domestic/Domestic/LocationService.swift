import Foundation
import Combine

class LocationService: ObservableObject {
    @Published var provinces: [Province] = []
    @Published var districts: [District] = []
    @Published var isLoading = false
    
    let turkeyCities: [String: [String]] = [
        "Adana": ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam"],
        "Ankara": ["Çankaya", "Keçiören", "Mamak", "Yenimahalle", "Altındağ", "Etimesgut", "Sincan", "Pursaklar"],
        "Antalya": ["Muratpaşa", "Kepez", "Konyaaltı", "Alanya", "Manavgat"],
        "Bursa": ["Osmangazi", "Nilüfer", "Yıldırım", "İnegöl", "Gemlik"],
        "Gaziantep": ["Şahinbey", "Şehitkamil", "Nizip"],
        "İstanbul": ["Kadıköy", "Beşiktaş", "Şişli", "Fatih", "Üsküdar", "Bakırköy", "Beyoğlu", "Sarıyer"],
        "İzmir": ["Bornova", "Buca", "Konak", "Karşıyaka", "Çiğli", "Gaziemir", "Menemen"],
        "Kocaeli": ["İzmit", "Gebze", "Darıca", "Körfez", "Gölcük"],
        "Konya": ["Selçuklu", "Meram", "Karatay", "Ereğli"],
        "Şanlıurfa": ["Haliliye", "Eyyübiye", "Karaköprü", "Siverek"]
    ]
    
    struct Province: Codable, Identifiable, Equatable {
        let id: Int
        let name: String
    }
    
    struct District: Codable, Identifiable, Equatable {
        let id: Int
        let name: String
    }
    
    struct ProvinceResponse: Codable {
        let status: String
        let data: [Province]
    }
    
    struct ProvinceDetailResponse: Codable {
        let status: String
        let data: ProvinceDetailData
    }
    
    struct ProvinceDetailData: Codable {
        let id: Int
        let name: String
        let districts: [District]
    }
    
    func fetchProvinces() {
        isLoading = true
        guard let url = URL(string: "https://turkiyeapi.dev/api/v1/provinces?fields=id,name") else { return }
        
        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data {
                if let decoded = try? JSONDecoder().decode(ProvinceResponse.self, from: data) {
                    DispatchQueue.main.async {
                        self.provinces = decoded.data.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
                        self.isLoading = false
                    }
                    return
                }
            }
            DispatchQueue.main.async {
                self.isLoading = false
            }
        }.resume()
    }
    
    func fetchDistricts(provinceId: Int) {
        // Since turkiyeapi.dev does not have /provinces/{id}/districts, we fetch the province detail
        // which includes the districts list under data.districts.
        guard let url = URL(string: "https://turkiyeapi.dev/api/v1/provinces/\(provinceId)") else { return }
        
        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data {
                if let decoded = try? JSONDecoder().decode(ProvinceDetailResponse.self, from: data) {
                    DispatchQueue.main.async {
                        self.districts = decoded.data.districts.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
                    }
                }
            }
        }.resume()
    }
}
