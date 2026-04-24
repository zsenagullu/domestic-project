import SwiftUI

struct CustomerDashboardView: View {
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?
    
    @State private var showComingSoonAlert = false
    @State private var showCreateJobSheet = false
    @State private var showDirectBookingSheet = false
    
    // Offers states
    @State private var myJobs: [Job] = []
    @State private var isLoadingOffers = false
    @State private var offersErrorMessage: String?
    
    // Domestic Red Palette
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255) // #E63946

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 25) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Hoş geldin,")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text(userName ?? "Müşteri")
                            .font(.system(size: 32, weight: .black))
                            .foregroundColor(.primary)
                    }
                    Spacer()
                    Image(systemName: "person.crop.circle.fill")
                        .resizable()
                        .frame(width: 45, height: 45)
                        .foregroundColor(domesticRed)
                }
                .padding(.horizontal)
                .padding(.top, 40)
                
                // Dashboard Cards
                VStack(spacing: 20) {
                    DashboardCard(
                        title: "Hızlı ve Pratik Eşleşme",
                        description: "Kriterlere göre en uygun uzmanı bul",
                        buttonTitle: "Form Doldur",
                        icon: "doc.text.magnifyingglass",
                        color: domesticRed,
                        action: { showDirectBookingSheet = true }
                    )
                    
                    DashboardCard(
                        title: "Esnek ve Ekonomik Çözüm",
                        description: "İlan oluştur, teklifleri bekle",
                        buttonTitle: "İlan Oluştur",
                        icon: "megaphone.fill",
                        color: Color.black,
                        action: { showCreateJobSheet = true }
                    )
                }
                .padding(.horizontal)
                
                // MARK: - Incoming Offers Section
                VStack(alignment: .leading, spacing: 15) {
                    HStack {
                        Text("Gelen Teklifler")
                            .font(.title2)
                            .fontWeight(.bold)
                        Spacer()
                        if isLoadingOffers {
                            ProgressView()
                        } else {
                            Button(action: { Task { await fetchMyJobsAndOffers() } }) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.subheadline)
                                    .foregroundColor(domesticRed)
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    if myJobs.isEmpty && !isLoadingOffers {
                        VStack(spacing: 15) {
                            Image(systemName: "envelope.open")
                                .font(.system(size: 40))
                                .foregroundColor(.gray.opacity(0.3))
                            Text("Henüz bir teklif gelmedi.")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 30)
                        .background(Color.white)
                        .cornerRadius(16)
                        .padding(.horizontal)
                    } else {
                        VStack(spacing: 16) {
                            ForEach(myJobs) { job in
                                if let offers = job.offers, !offers.isEmpty {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Text(job.title)
                                            .font(.headline)
                                            .padding(.horizontal, 5)
                                        
                                        ForEach(offers) { offer in
                                            IncomingOfferCard(offer: offer, accentColor: domesticRed) { status in
                                                Task { await handleOfferAction(offerId: offer.id, status: status) }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                
                Spacer(minLength: 30)
                
                // Logout Button
                Button(action: {
                    token = nil
                    role = nil
                    userName = nil
                }) {
                    Text("Çıkış Yap")
                        .bold()
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(domesticRed)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.bottom, 30)
            }
        }
        .background(Color(.systemGroupedBackground))
        .onAppear {
            Task { await fetchMyJobsAndOffers() }
        }
        .alert("Bilgi", isPresented: $showComingSoonAlert) {
            Button("Tamam", role: .cancel) {}
        } message: {
            Text("Bu özellik yakında geliyor")
        }
        .sheet(isPresented: $showCreateJobSheet) {
            CreateJobSheet(isPresented: $showCreateJobSheet)
        }
        .sheet(isPresented: $showDirectBookingSheet) {
            DirectBookingSheet(isPresented: $showDirectBookingSheet)
        }
    }
    
    func fetchMyJobsAndOffers() async {
        guard let tokenValue = token else { return }
        
        await MainActor.run { isLoadingOffers = true }
        
        do {
            let allJobs = try await NetworkManager.shared.fetchJobs(token: tokenValue)
            let userResponse = try await fetchCurrentUserId(token: tokenValue)
            let filtered = allJobs.filter { $0.userId == userResponse.id }
            
            await MainActor.run {
                self.myJobs = filtered
                self.isLoadingOffers = false
            }
        } catch {
            await MainActor.run {
                self.offersErrorMessage = "Teklifler yüklenemedi."
                self.isLoadingOffers = false
            }
        }
    }
    
    func fetchCurrentUserId(token: String) async throws -> User {
        guard let url = URL(string: "http://127.0.0.1:8000/api/v1/users/me") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    func handleOfferAction(offerId: Int, status: String) async {
        guard let tokenValue = token else { return }
        
        do {
            try await NetworkManager.shared.updateOfferStatus(offerId: offerId, status: status, token: tokenValue)
            await fetchMyJobsAndOffers()
        } catch {
            print("Error updating offer: \(error)")
        }
    }
}

struct CreateJobSheet: View {
    @Binding var isPresented: Bool
    @AppStorage("token") var token: String?
    
    @State private var title = ""
    @State private var description = ""
    @State private var location = ""
    @State private var houseSize = "medium"
    @State private var budget = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255)
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("İlan Bilgileri")) {
                    TextField("İlan Başlığı", text: $title)
                    
                    ZStack(alignment: .topLeading) {
                        if description.isEmpty {
                            Text("Açıklama (En az 10 karakter)")
                                .foregroundColor(.gray.opacity(0.5))
                                .padding(.top, 8)
                                .padding(.leading, 5)
                        }
                        TextEditor(text: $description)
                            .frame(minHeight: 120)
                            .lineLimit(4)
                    }
                }
                
                Section(header: Text("Detaylar")) {
                    TextField("Konum", text: $location)
                    
                    Picker("Ev Büyüklüğü", selection: $houseSize) {
                        Text("Küçük").tag("small")
                        Text("Orta").tag("medium")
                        Text("Büyük").tag("large")
                    }
                    
                    TextField("Tahmini Bütçe (TL, Opsiyonel)", text: $budget)
                        .keyboardType(.numberPad)
                }
                
                Section {
                    Button(action: createJob) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("İlanı Oluştur")
                                .bold()
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.vertical, 8)
                    .background(title.isEmpty || description.count < 10 || isLoading ? Color.gray : domesticRed)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(title.isEmpty || description.count < 10 || isLoading)
                }
            }
            .navigationTitle("İlan Oluştur")
            .navigationBarItems(leading: Button("İptal") { isPresented = false })
            .alert(isSuccess ? "Başarılı" : "Hata", isPresented: $showAlert) {
                Button("Tamam") {
                    if isSuccess {
                        isPresented = false
                    }
                }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    func createJob() {
        guard let tokenValue = token else {
            alertMessage = "Lütfen önce giriş yapın."
            showAlert = true
            return
        }
        
        isLoading = true
        let price = Double(budget)
        
        Task {
            do {
                _ = try await NetworkManager.shared.createJob(
                    title: title,
                    description: description,
                    location: location.isEmpty ? nil : location,
                    houseSize: houseSize,
                    price: price,
                    serviceType: "MARKETPLACE_BIDDING",
                    token: tokenValue
                )
                
                await MainActor.run {
                    isSuccess = true
                    alertMessage = "İlanınız oluşturuldu!"
                    showAlert = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isSuccess = false
                    alertMessage = "Bir hata oluştu, tekrar deneyin."
                    showAlert = true
                    isLoading = false
                }
            }
        }
    }
}

struct DirectBookingSheet: View {
    @Binding var isPresented: Bool
    @AppStorage("token") var token: String?
    
    @State private var location = ""
    @State private var houseSize = "medium"
    @State private var hasPet = false
    @State private var allergyInfo = ""
    @State private var budget = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255)
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Hızlı Eşleşme Formu")) {
                    TextField("Konum (İlçe/Semt)", text: $location)
                    
                    Picker("Ev Büyüklüğü", selection: $houseSize) {
                        Text("Küçük").tag("small")
                        Text("Orta").tag("medium")
                        Text("Büyük").tag("large")
                    }
                    
                    Toggle("Evcil Hayvan Var mı?", isOn: $hasPet)
                    
                    TextField("Alerji Bilgisi (Opsiyonel)", text: $allergyInfo)
                }
                
                Section(header: Text("Bütçe")) {
                    TextField("Tahmini Bütçe (TL, Opsiyonel)", text: $budget)
                        .keyboardType(.numberPad)
                }
                
                Section {
                    Button(action: findExpert) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Uzman Bul")
                                .bold()
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.vertical, 8)
                    .background(location.isEmpty || isLoading ? Color.gray : domesticRed)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(location.isEmpty || isLoading)
                }
            }
            .navigationTitle("Hızlı Eşleşme")
            .navigationBarItems(leading: Button("İptal") { isPresented = false })
            .alert(isSuccess ? "Başarılı" : "Hata", isPresented: $showAlert) {
                Button("Tamam") {
                    if isSuccess {
                        isPresented = false
                    }
                }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    func findExpert() {
        guard let tokenValue = token else {
            alertMessage = "Lütfen önce giriş yapın."
            showAlert = true
            return
        }
        
        isLoading = true
        let price = Double(budget)
        let petStatus = hasPet ? "Var" : "Yok"
        let allergyStr = allergyInfo.isEmpty ? "Yok" : allergyInfo
        let combinedDescription = "Evcil hayvan: \(petStatus), Alerji: \(allergyStr)"
        
        Task {
            do {
                _ = try await NetworkManager.shared.createJob(
                    title: "Hızlı Eşleşme Talebi",
                    description: combinedDescription,
                    location: location,
                    houseSize: houseSize,
                    price: price,
                    serviceType: "DIRECT_BOOKING",
                    token: tokenValue
                )
                
                await MainActor.run {
                    isSuccess = true
                    alertMessage = "Talebiniz alındı! En uygun uzmanlar listeleniyor..."
                    showAlert = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isSuccess = false
                    alertMessage = "Bir hata oluştu."
                    showAlert = true
                    isLoading = false
                }
            }
        }
    }
}

struct DashboardCard: View {
    let title: String
    let description: String
    let buttonTitle: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.bold)
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Button(action: action) {
                Text(buttonTitle)
                    .font(.callout)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(color)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

#Preview {
    CustomerDashboardView()
}

struct IncomingOfferCard: View {
    let offer: Offer
    let accentColor: Color
    let onAction: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "person.fill")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(offer.worker?.name ?? "Uzman")
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                Spacer()
                statusBadge(offer.status)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Teklif:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(offer.offeredPrice)) TL")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                
                HStack {
                    Text("Süre:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(offer.estimatedTime ?? "Belirtilmedi")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                if !offer.message.isEmpty {
                    Text(offer.message)
                        .font(.footnote)
                        .foregroundColor(.secondary)
                        .italic()
                        .padding(.top, 4)
                }
            }
            
            if offer.status == .pending {
                Divider()
                    .padding(.vertical, 4)
                
                HStack(spacing: 12) {
                    Button(action: { onAction("accepted") }) {
                        HStack {
                            Image(systemName: "check.circle.fill")
                            Text("Kabul Et")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: { onAction("rejected") }) {
                        HStack {
                            Image(systemName: "x.circle.fill")
                            Text("Reddet")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .foregroundColor(.red)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.red, lineWidth: 1)
                        )
                    }
                }
            }
        }
        .padding(15)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
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
