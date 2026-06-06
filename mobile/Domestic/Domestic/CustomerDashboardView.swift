import SwiftUI
import Speech
import AVFoundation
import Combine

struct CustomerDashboardView: View {
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?
    
    @State private var showComingSoonAlert = false
    @State private var showCreateJobSheet = false
    @State private var showDirectBookingSheet = false
    
    // AI States
    @State private var aiInput = ""
    @State private var aiResult: AIAnalysisResult? = nil
    @State private var isAnalyzing = false
    @State private var aiInitialJobData: AIInitialJobData? = nil
    @StateObject private var speechManager = SpeechRecognizerManager()
    
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
                    
                    AICardView(
                        aiInput: $aiInput,
                        isAnalyzing: $isAnalyzing,
                        aiResult: $aiResult,
                        speechManager: speechManager,
                        accentColor: Color(hex: "7C3AED"),
                        onAnalyze: runAIAnalysis,
                        onCreateJob: {
                            let location = aiResult?.location ?? ""
                            aiInitialJobData = AIInitialJobData(
                                title: "\(location.isEmpty ? "Evin" : location) İçin Temizlik Talebi",
                                description: aiResult?.description ?? aiInput,
                                location: location,
                                houseSize: aiResult?.houseSize ?? "medium",
                                budget: aiResult?.estimatedPrice != nil ? String(Int(aiResult!.estimatedPrice!)) : "",
                                cleaningType: aiResult?.cleaningType ?? "Genel Temizlik",
                                preferredDate: aiResult?.preferredDate ?? "",
                                hasPets: aiResult?.hasPets ?? false,
                                hasAllergies: aiResult?.hasAllergies ?? false,
                                specialNotes: aiResult?.specialNotes ?? ""
                            )
                            showCreateJobSheet = true
                        }
                    )
                    
                    DashboardCard(
                        title: "Esnek ve Ekonomik Çözüm",
                        description: "İlan oluştur, teklifleri bekle",
                        buttonTitle: "İlan Oluştur",
                        icon: "megaphone.fill",
                        color: Color.black,
                        action: { 
                            aiInitialJobData = nil
                            showCreateJobSheet = true 
                        }
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
            if let data = aiInitialJobData {
                CreateJobSheet(
                    isPresented: $showCreateJobSheet,
                    initialTitle: data.title,
                    initialDescription: data.description,
                    initialLocation: data.location,
                    initialHouseSize: data.houseSize,
                    initialBudget: data.budget,
                    initialCleaningType: data.cleaningType,
                    initialPreferredDate: data.preferredDate,
                    initialHasPets: data.hasPets,
                    initialHasAllergies: data.hasAllergies,
                    initialSpecialNotes: data.specialNotes
                )
            } else {
                CreateJobSheet(isPresented: $showCreateJobSheet)
            }
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
    
    func runAIAnalysis() {
        guard let tokenValue = token, !aiInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isAnalyzing = true
        aiResult = nil
        
        Task {
            do {
                let result = try await NetworkManager.shared.analyzeVoiceCommand(text: aiInput, token: tokenValue)
                await MainActor.run {
                    self.aiResult = result
                    self.isAnalyzing = false
                }
            } catch {
                print("❌ AI analysis failed: \(error)")
                await MainActor.run {
                    self.isAnalyzing = false
                }
            }
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
    @State private var cleaningType = "Genel Temizlik"
    @State private var preferredDate = Date()
    @State private var hasPets = false
    @State private var hasAllergies = false
    @State private var specialNotes = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    var initialTitle: String = ""
    var initialDescription: String = ""
    var initialLocation: String = ""
    var initialHouseSize: String = "medium"
    var initialBudget: String = ""
    var initialCleaningType: String = "Genel Temizlik"
    var initialPreferredDate: String = ""
    var initialHasPets: Bool = false
    var initialHasAllergies: Bool = false
    var initialSpecialNotes: String = ""
    
    init(isPresented: Binding<Bool>, 
         initialTitle: String = "", 
         initialDescription: String = "", 
         initialLocation: String = "", 
         initialHouseSize: String = "medium", 
         initialBudget: String = "",
         initialCleaningType: String = "Genel Temizlik",
         initialPreferredDate: String = "",
         initialHasPets: Bool = false,
         initialHasAllergies: Bool = false,
         initialSpecialNotes: String = "") {
        self._isPresented = isPresented
        self.initialTitle = initialTitle
        self.initialDescription = initialDescription
        self.initialLocation = initialLocation
        self.initialHouseSize = initialHouseSize
        self.initialBudget = initialBudget
        self.initialCleaningType = initialCleaningType
        self.initialPreferredDate = initialPreferredDate
        self.initialHasPets = initialHasPets
        self.initialHasAllergies = initialHasAllergies
        self.initialSpecialNotes = initialSpecialNotes
        
        self._title = State(initialValue: initialTitle)
        self._description = State(initialValue: initialDescription)
        self._location = State(initialValue: initialLocation)
        self._houseSize = State(initialValue: initialHouseSize)
        self._budget = State(initialValue: initialBudget)
        self._cleaningType = State(initialValue: initialCleaningType)
        
        let parsedDate: Date
        if !initialPreferredDate.isEmpty {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            parsedDate = formatter.date(from: initialPreferredDate) ?? Date()
        } else {
            parsedDate = Date()
        }
        self._preferredDate = State(initialValue: parsedDate)
        self._hasPets = State(initialValue: initialHasPets)
        self._hasAllergies = State(initialValue: initialHasAllergies)
        self._specialNotes = State(initialValue: initialSpecialNotes)
    }
    
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
                
                Section(header: Text("Ek Detaylar")) {
                    Picker("Temizlik Tipi", selection: $cleaningType) {
                        Text("Genel Temizlik").tag("Genel Temizlik")
                        Text("Derin Temizlik").tag("Derin Temizlik")
                        Text("Cam Temizliği").tag("Cam Temizliği")
                        Text("Halı Yıkama").tag("Halı Yıkama")
                        Text("İnşaat Sonrası Temizlik").tag("İnşaat Sonrası Temizlik")
                        Text("Ofis Temizliği").tag("Ofis Temizliği")
                    }
                    
                    DatePicker("Tercih Edilen Tarih", selection: $preferredDate, displayedComponents: .date)
                    
                    Toggle("Evcil Hayvan (\(hasPets ? "Var" : "Yok"))", isOn: $hasPets)
                    
                    Toggle("Alerjim Var (\(hasAllergies ? "Evet" : "Hayır"))", isOn: $hasAllergies)
                    
                    TextField("Özel Notlar (Opsiyonel)", text: $specialNotes)
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
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateStr = dateFormatter.string(from: preferredDate)
        let petsText = hasPets ? "Var" : "Yok"
        let allergiesText = hasAllergies ? "Evet" : "Hayır"
        
        let combinedDescription = "\(description) | Temizlik: \(cleaningType) | Tarih: \(dateStr) | Evcil Hayvan: \(petsText) | Alerji: \(allergiesText) | Not: \(specialNotes)"
        
        Task {
            do {
                _ = try await NetworkManager.shared.createJob(
                    title: title,
                    description: combinedDescription,
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

struct AIInitialJobData {
    var title: String
    var description: String
    var location: String
    var houseSize: String
    var budget: String
    var cleaningType: String
    var preferredDate: String
    var hasPets: Bool
    var hasAllergies: Bool
    var specialNotes: String
}

struct ResultItemView: View {
    let title: String
    let value: String
    let icon: String
    let accentColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.secondary)
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(accentColor)
                Text(value)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

class SpeechRecognizerManager: ObservableObject {
    private var audioEngine: AVAudioEngine?
    private var speechRecognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    @Published var isRecording = false
    @Published var transcript = ""
    @Published var authorizationStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
    
    init() {
        self.speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "tr-TR"))
    }
    
    func checkAuthorization() {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                self.authorizationStatus = status
            }
        }
    }
    
    func startRecording() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                self.authorizationStatus = authStatus
                guard authStatus == .authorized else {
                    print("❌ Speech recognition not authorized")
                    return
                }
                
                do {
                    try self.startSession()
                } catch {
                    print("❌ Audio Engine Error: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func startSession() throws {
        recognitionTask?.cancel()
        recognitionTask = nil
        
        audioEngine = AVAudioEngine()
        request = SFSpeechAudioBufferRecognitionRequest()
        
        guard let request = request, let audioEngine = audioEngine else { return }
        request.shouldReportPartialResults = true
        
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.request?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        
        isRecording = true
        transcript = ""
        
        recognitionTask = speechRecognizer?.recognitionTask(with: request) { result, error in
            if let result = result {
                DispatchQueue.main.async {
                    self.transcript = result.bestTranscription.formattedString
                }
            }
            if error != nil || result?.isFinal == true {
                self.stopRecording()
            }
        }
    }
    
    func stopRecording() {
        audioEngine?.stop()
        request?.endAudio()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionTask?.cancel()
        
        audioEngine = nil
        request = nil
        recognitionTask = nil
        
        DispatchQueue.main.async {
            self.isRecording = false
        }
    }
}

struct AICardView: View {
    @Binding var aiInput: String
    @Binding var isAnalyzing: Bool
    @Binding var aiResult: AIAnalysisResult?
    @ObservedObject var speechManager: SpeechRecognizerManager
    let accentColor: Color
    let onAnalyze: () -> Void
    let onCreateJob: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.title2)
                    .foregroundColor(accentColor)
                Text("AI ile Hızlı Planla")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
            }
            
            HStack(alignment: .top) {
                ZStack(alignment: .topLeading) {
                    if aiInput.isEmpty {
                        Text("Talebinizi yazın...")
                            .foregroundColor(.gray.opacity(0.5))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                    }
                    TextEditor(text: $aiInput)
                        .frame(height: 70)
                        .padding(4)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(10)
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
                
                Button(action: {
                    if speechManager.isRecording {
                        speechManager.stopRecording()
                    } else {
                        speechManager.startRecording()
                    }
                }) {
                    Image(systemName: speechManager.isRecording ? "stop.fill" : "mic.fill")
                        .foregroundColor(.white)
                        .padding(12)
                        .background(speechManager.isRecording ? Color.red : accentColor)
                        .clipShape(Circle())
                }
                .padding(.top, 4)
            }
            
            Button(action: onAnalyze) {
                HStack {
                    if isAnalyzing {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: "sparkles")
                        Text("AI ile Analiz Et")
                    }
                }
                .font(.callout)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(aiInput.isEmpty || isAnalyzing ? Color.gray : accentColor)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(aiInput.isEmpty || isAnalyzing)
            
            if let result = aiResult {
                VStack(alignment: .leading, spacing: 12) {
                    Divider()
                    
                    Text("Analiz Sonucu")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(accentColor)
                    
                    VStack(spacing: 8) {
                        HStack(spacing: 8) {
                            ResultItemView(title: "Konum", value: result.location ?? "Belirtilmedi", icon: "mappin.circle.fill", accentColor: accentColor)
                            ResultItemView(title: "Ev Büyüklüğü", value: translateHouseSize(result.houseSize), icon: "house.fill", accentColor: accentColor)
                        }
                        HStack(spacing: 8) {
                            let priceVal = result.estimatedPrice != nil ? "\(Int(result.estimatedPrice!)) TL" : "Belirtilmedi"
                            ResultItemView(title: "Tahmini Fiyat", value: priceVal, icon: "dollarsign.circle.fill", accentColor: .green)
                            ResultItemView(title: "Hizmet Tipi", value: translateServiceType(result.serviceType), icon: "clock.fill", accentColor: accentColor)
                        }
                    }
                    
                    Button(action: onCreateJob) {
                        HStack {
                            Image(systemName: "doc.text.badge.plus")
                            Text("Bu Bilgilerle İlan Oluştur")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .foregroundColor(accentColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(accentColor, lineWidth: 1)
                        )
                    }
                    .padding(.top, 5)
                }
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
        .onChange(of: speechManager.transcript) { newValue in
            if !newValue.isEmpty {
                aiInput = newValue
            }
        }
    }
    
    private func translateHouseSize(_ size: String?) -> String {
        switch size {
        case "small": return "Küçük"
        case "medium": return "Orta"
        case "large": return "Büyük"
        default: return "Orta"
        }
    }
    
    private func translateServiceType(_ type: String?) -> String {
        switch type {
        case "MARKETPLACE_BIDDING": return "Teklif Usulü"
        case "DIRECT_BOOKING": return "Hızlı Eşleşme"
        default: return "Teklif Usulü"
        }
    }
}
