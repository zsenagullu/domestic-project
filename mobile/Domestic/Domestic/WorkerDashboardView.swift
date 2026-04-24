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
    @State private var selectedJob: Job?
    @State private var showOfferSheet = false

    
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
                                    selectedJob = job
                                    showOfferSheet = true
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
            .sheet(item: $selectedJob) { job in
                OfferSheetView(job: job, workerBlue: workerBlue)
            }
            .onAppear {
                Task { await fetchJobs() }
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

// MARK: - Offer Sheet
struct OfferSheetView: View {
    let job: Job
    let workerBlue: Color
    @Environment(\.dismiss) var dismiss
    @AppStorage("token") var token: String?
    
    @State private var offeredPrice: String = ""
    @State private var message: String = ""
    @State private var estimatedTime: String = ""
    @State private var isLoading = false
    
    @State private var showAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var shouldDismissOnAlertClose = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("İş Detayları")) {
                    Text(job.title)
                        .font(.headline)
                        .foregroundColor(workerBlue)
                    if let price = job.price {
                        Text("Müşteri Bütçesi: \(Int(price)) TL")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Section(header: Text("Teklifiniz")) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Teklif Fiyatı (TL)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Örn: 1200", text: $offeredPrice)
                            .keyboardType(.numberPad)
                            .padding(10)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Tahmini Süre")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Örn: 3 saat", text: $estimatedTime)
                            .padding(10)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Mesajınız")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextEditor(text: $message)
                            .frame(minHeight: 120)
                            .padding(4)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
                .padding(.vertical, 4)
                
                Section {
                    Button(action: sendOffer) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Teklif Gönder")
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                    }
                    .listRowBackground(workerBlue)
                    .disabled(isLoading || offeredPrice.isEmpty || message.isEmpty || estimatedTime.isEmpty)
                }
            }
            .navigationTitle("Teklif Ver")
            .navigationBarItems(trailing: Button("Vazgeç") { dismiss() }.foregroundColor(.secondary))
            .alert(isPresented: $showAlert) {
                Alert(
                    title: Text(alertTitle),
                    message: Text(alertMessage),
                    dismissButton: .default(Text("Tamam")) {
                        if shouldDismissOnAlertClose {
                            dismiss()
                        }
                    }
                )
            }
        }
    }
    
    private func sendOffer() {
        guard let token = token, let price = Double(offeredPrice) else { return }
        
        isLoading = true
        Task {
            do {
                try await NetworkManager.shared.createOffer(
                    jobId: job.id,
                    offeredPrice: price,
                    message: message,
                    estimatedTime: estimatedTime,
                    token: token
                )
                alertTitle = "Başarılı"
                alertMessage = "Teklifiniz başarıyla gönderildi!"
                shouldDismissOnAlertClose = true
                showAlert = true
            } catch {
                alertTitle = "Hata"
                alertMessage = "Teklif gönderilemedi, tekrar deneyin."
                shouldDismissOnAlertClose = false
                showAlert = true
            }
            isLoading = false
        }
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
            ZStack {
                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
                        Text("Teklifler yükleniyor...")
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
                            Task { await fetchOffers() }
                        }
                        .padding()
                        .background(workerBlue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                } else if offers.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.3))
                        Text("Henüz teklif göndermediniz")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(offers) { offer in
                                OfferCardView(offer: offer)
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await fetchOffers()
                    }
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
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(offer.job?.title ?? "İş Başlığı")
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
                statusBadge(offer.status)
            }
            
            Divider()
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Teklif Fiyatı")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(offer.offeredPrice)) TL")
                        .font(.subheadline)
                        .bold()
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Tahmini Süre")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(offer.estimatedTime ?? "Belirtilmedi")
                        .font(.subheadline)
                        .bold()
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Mesajınız")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(offer.message)
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .italic()
                    .lineLimit(2)
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        .padding(.vertical, 4)
    }
    
    @ViewBuilder
    private func statusBadge(_ status: OfferStatus) -> some View {
        let (text, color) = statusDetails(status)
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(5)
    }
    
    private func statusDetails(_ status: OfferStatus) -> (String, Color) {
        switch status {
        case .pending: return ("BEKLEMEDE", .orange)
        case .accepted: return ("KABUL EDİLDİ", .green)
        case .rejected: return ("REDDEDİLDİ", .red)
        }
    }
}

struct WorkerDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        WorkerDashboardView()
    }
}
