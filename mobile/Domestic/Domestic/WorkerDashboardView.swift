import SwiftUI

struct WorkerDashboardView: View {
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?
    
    let workerBlue = Color(red: 30/255, green: 58/255, blue: 138/255) // #1E3A8A

    var body: some View {
        TabView {
            OpenJobsView(workerBlue: workerBlue)
                .tabItem {
                    Label("Açık İlanlar", systemImage: "briefcase")
                }
            
            MyOffersView(workerBlue: workerBlue)
                .tabItem {
                    Label("Tekliflerim", systemImage: "doc.text")
                }
            
            WorkerProfileView(workerBlue: workerBlue)
                .tabItem {
                    Label("Profilim", systemImage: "person")
                }
        }
        .accentColor(workerBlue)
    }
}

// MARK: - Open Jobs Tab
struct OpenJobsView: View {
    let workerBlue: Color
    @AppStorage("token") var token: String?
    @State private var jobs: [Job] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showOfferAlert = false
    
    private var filteredJobs: [Job] {
        jobs.filter { $0.serviceType == .marketplaceBidding }
    }

    var body: some View {
        NavigationView {
            ZStack {
                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
                        Text("İlanlar yükleniyor...")
                            .foregroundColor(.secondary)
                    }
                } else if let error = errorMessage {
                    VStack(spacing: 15) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.orange)
                        Text(error)
                            .font(.headline)
                        Button("Tekrar Dene") {
                            Task { await fetchJobs() }
                        }
                        .padding()
                        .background(workerBlue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                } else if filteredJobs.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "briefcase.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.3))
                        Text("Henüz açık ilan yok")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Pazaryeri (Açık İlanlar)")
                                .font(.title2)
                                .fontWeight(.black)
                            Text("İlanları inceleyip sana uygun olanlara teklif ver!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.top)

                        LazyVStack(spacing: 16) {
                            ForEach(filteredJobs) { job in
                                JobCardView(job: job, accentColor: workerBlue, onOffer: {
                                    showOfferAlert = true
                                })
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await fetchJobs()
                    }
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .onAppear {
                Task { await fetchJobs() }
            }
            .alert("Bilgi", isPresented: $showOfferAlert) {
                Button("Tamam", role: .cancel) {}
            } message: {
                Text("Teklif verme yakında eklenecek")
            }
        }
    }

    private func fetchJobs() async {
        isLoading = true
        errorMessage = nil
        do {
            jobs = try await NetworkManager.shared.fetchJobs(token: token)
        } catch {
            errorMessage = "İlanlar yüklenemedi"
        }
        isLoading = false
    }
}

// MARK: - My Offers Tab
struct MyOffersView: View {
    let workerBlue: Color
    @AppStorage("token") var token: String?
    @State private var offers: [Offer] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView()
                } else if offers.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("Henüz teklif göndermediniz")
                            .foregroundColor(.secondary)
                    }
                } else {
                    List(offers) { offer in
                        OfferCardView(offer: offer)
                    }
                    .listStyle(InsetGroupedListStyle())
                }
            }
            .navigationTitle("Tekliflerim")
            .onAppear {
                Task { await fetchOffers() }
            }
        }
    }

    private func fetchOffers() async {
        guard let token = token else { return }
        isLoading = true
        do {
            offers = try await NetworkManager.shared.fetchMyOffers(token: token)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - Profile Tab
struct WorkerProfileView: View {
    let workerBlue: Color
    @AppStorage("userName") var userName: String?
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Hesap Bilgileri")) {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.largeTitle)
                            .foregroundColor(workerBlue)
                        VStack(alignment: .leading) {
                            Text(userName ?? "Kullanıcı")
                                .font(.headline)
                            Text("Çalışan Hesabı")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section(header: Text("Diğer")) {
                    Text("Profil düzenleme yakında")
                        .foregroundColor(.secondary)
                    
                    Button(action: {
                        token = nil
                        role = nil
                    }) {
                        Text("Çıkış Yap")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Profilim")
        }
    }
}

// MARK: - Subviews
struct JobCardView: View {
    let job: Job
    let accentColor: Color
    let onOffer: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(job.title)
                    .font(.system(size: 18, weight: .bold))
                Spacer()
                Text("TEKLİF ALIMI")
                    .font(.system(size: 10, weight: .black))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(red: 52/255, green: 199/255, blue: 89/255).opacity(0.1)) // #34C759
                    .foregroundColor(Color(red: 52/255, green: 199/255, blue: 89/255))
                    .cornerRadius(5)
            }
            
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.gray)
                    Text(job.location ?? "Konum belirtilmedi")
                }
                .font(.subheadline)
                
                HStack(spacing: 8) {
                    Image(systemName: "house.fill")
                        .foregroundColor(.gray)
                    Text("Ev Büyüklüğü: ") + Text(houseSizeText(job.houseSize)).bold()
                }
                .font(.subheadline)
                
                HStack(spacing: 8) {
                    Image(systemName: "turkishlirasign.circle.fill")
                        .foregroundColor(job.price != nil ? .green : .gray)
                    if let price = job.price {
                        Text("Bütçe: ") + Text(String(format: "%.0f TL", price)).bold().foregroundColor(.green)
                    } else {
                        Text("Bütçe: Belirtilmedi").foregroundColor(.gray)
                    }
                }
                .font(.subheadline)
            }
            
            Divider()
                .padding(.vertical, 4)
            
            Button(action: onOffer) {
                Text("Teklif Ver")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(accentColor)
                    .cornerRadius(10)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(15)
        .shadow(color: Color.black.opacity(0.08), radius: 10, x: 0, y: 5)
    }
    
    private func houseSizeText(_ size: String?) -> String {
        switch size {
        case "small": return "Küçük"
        case "medium": return "Orta"
        case "large": return "Büyük"
        default: return "Belirtilmedi"
        }
    }
}

struct OfferCardView: View {
    let offer: Offer
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(offer.job?.title ?? "İş Başlığı Yüklenemedi")
                .font(.headline)
            Text("\(Int(offer.offeredPrice)) TL")
                .foregroundColor(.blue)
                .bold()
            HStack {
                Text("Durum:")
                Text(offer.status.rawValue.uppercased())
                    .fontWeight(.semibold)
                    .foregroundColor(statusColor(offer.status))
            }
            .font(.caption)
        }
        .padding(.vertical, 4)
    }
    
    private func statusColor(_ status: OfferStatus) -> Color {
        switch status {
        case .pending: return .orange
        case .accepted: return .green
        case .rejected: return .red
        }
    }
}

struct WorkerDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        WorkerDashboardView()
    }
}
