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
    
    // Review states
    @State private var showReviewSheet = false
    @State private var selectedOfferForReview: Offer? = nil
    
    // Job Completion States
    @State private var isCompletingJob = false
    @State private var showCompleteAlert = false
    @State private var completeAlertMessage = ""
    
    // Edit job states
    @State private var showEditJobSheet = false
    @State private var selectedJobForEdit: Job? = nil
    
    // Matching states
    @State private var showMatchesSheet = false
    @State private var matchedWorkers: [WorkerMatch] = []
    @State private var isFetchingMatches = false
    @State private var matchesError: String? = nil
    @State private var lastCreatedJobId: Int? = nil
    
    // Domestic Red Palette
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255) // #E63946

    private var totalJobsCount: Int { myJobs.count }
    private var totalOffersCount: Int { myJobs.reduce(0) { $0 + ($1.offers?.count ?? 0) } }
    private var acceptedOffersCount: Int { myJobs.reduce(0) { $0 + ($1.offers?.filter({ $0.status == .accepted }).count ?? 0) } }
    private var averageOfferPrice: Int {
        let allOffers = myJobs.flatMap { $0.offers ?? [] }
        guard !allOffers.isEmpty else { return 0 }
        let total = allOffers.reduce(0.0) { $0 + $1.offeredPrice }
        return Int(total / Double(allOffers.count))
    }

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
                
                // MARK: - Özet İstatistikler Section
                VStack(alignment: .leading, spacing: 10) {
                    Text("Özet İstatistikler")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                        .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 15) {
                            // Toplam İlan (Mavi)
                            MiniStatCard(
                                title: "Toplam İlan",
                                value: "\(totalJobsCount)",
                                iconName: "briefcase.fill",
                                iconColor: .blue,
                                bgColor: Color.blue.opacity(0.1)
                            )
                            
                            // Gelen Teklif (Turuncu)
                            MiniStatCard(
                                title: "Gelen Teklif",
                                value: "\(totalOffersCount)",
                                iconName: "doc.text.fill",
                                iconColor: .orange,
                                bgColor: Color.orange.opacity(0.1)
                            )
                            
                            // Kabul Edilen (Yeşil)
                            MiniStatCard(
                                title: "Kabul Edilen",
                                value: "\(acceptedOffersCount)",
                                iconName: "checkmark.circle.fill",
                                iconColor: .green,
                                bgColor: Color.green.opacity(0.1)
                            )
                            
                            // Ort. Fiyat (Mor)
                            MiniStatCard(
                                title: "Ort. Fiyat",
                                value: "\(averageOfferPrice) TL",
                                iconName: "turkishlirasign.circle.fill",
                                iconColor: .purple,
                                bgColor: Color.purple.opacity(0.1)
                            )
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical, 5)
                
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
                        VStack(spacing: 20) {
                            ForEach(myJobs) { job in
                                VStack(alignment: .leading, spacing: 12) {
                                    // Job Card
                                    VStack(alignment: .leading, spacing: 12) {
                                        HStack(alignment: .top) {
                                            VStack(alignment: .leading, spacing: 6) {
                                                Text(job.title)
                                                    .font(.headline)
                                                    .fontWeight(.bold)
                                                    .foregroundColor(.primary)
                                                
                                                HStack(spacing: 8) {
                                                    let offerCount = job.offers?.count ?? 0
                                                    Text("\(offerCount) Teklif")
                                                        .font(.system(size: 10, weight: .bold))
                                                        .padding(.horizontal, 8)
                                                        .padding(.vertical, 4)
                                                        .background(Color.blue.opacity(0.1))
                                                        .foregroundColor(.blue)
                                                        .cornerRadius(5)
                                                    
                                                    jobStatusBadge(job.status)
                                                }
                                            }
                                            
                                            Spacer()
                                            
                                            Button(action: {
                                                selectedJobForEdit = job
                                                showEditJobSheet = true
                                            }) {
                                                Text("İlanı Düzenle")
                                                    .font(.system(size: 11, weight: .bold))
                                                    .padding(.horizontal, 10)
                                                    .padding(.vertical, 6)
                                                    .background(Color(.systemGray5))
                                                    .foregroundColor(.primary)
                                                    .cornerRadius(8)
                                            }
                                        }
                                    }
                                    .padding(15)
                                    .background(Color.white)
                                    .cornerRadius(16)
                                    .shadow(color: Color.black.opacity(0.04), radius: 5, x: 0, y: 2)
                                    
                                    // Job Offers list
                                    let offers = job.offers ?? []
                                    if offers.isEmpty {
                                        Text("Bu ilan için henüz teklif gelmedi")
                                            .font(.footnote)
                                            .foregroundColor(.secondary)
                                            .italic()
                                            .frame(maxWidth: .infinity, alignment: .center)
                                            .padding(.vertical, 15)
                                            .background(Color.white.opacity(0.5))
                                            .cornerRadius(12)
                                    } else {
                                        VStack(spacing: 12) {
                                            ForEach(offers) { offer in
                                                IncomingOfferCard(
                                                    offer: offer,
                                                    jobStatus: job.status,
                                                    accentColor: domesticRed,
                                                    onAction: { status in
                                                        Task { await handleOfferAction(offerId: offer.id, status: status) }
                                                    },
                                                    onReview: {
                                                        selectedOfferForReview = offer
                                                        showReviewSheet = true
                                                    },
                                                    onComplete: {
                                                        completeJob(job: job, offer: offer)
                                                    }
                                                )
                                            }
                                        }
                                        .padding(.leading, 10)
                                    }
                                    
                                    Divider()
                                        .padding(.vertical, 8)
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
        .alert("Başarılı", isPresented: $showCompleteAlert) {
            Button("Tamam", role: .cancel) {
                if selectedOfferForReview != nil {
                    showReviewSheet = true
                }
            }
        } message: {
            Text(completeAlertMessage)
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
            DirectBookingSheet(isPresented: $showDirectBookingSheet) { location, houseSize, jobId in
                self.lastCreatedJobId = jobId
                self.fetchMatches(location: location, houseSize: houseSize)
            }
        }
        .sheet(isPresented: $showMatchesSheet) {
            WorkerMatchesSheet(
                isPresented: $showMatchesSheet,
                workers: matchedWorkers,
                isLoading: isFetchingMatches,
                errorMessage: matchesError,
                jobId: lastCreatedJobId ?? 0
            )
        }
        .sheet(isPresented: $showReviewSheet) {
            if let offer = selectedOfferForReview {
                ReviewSheet(isPresented: $showReviewSheet, offer: offer, accentColor: domesticRed) {
                    Task { await fetchMyJobsAndOffers() }
                }
            }
        }
        .sheet(isPresented: $showEditJobSheet) {
            if let job = selectedJobForEdit {
                EditJobSheet(isPresented: $showEditJobSheet, job: job) {
                    Task { await fetchMyJobsAndOffers() }
                }
            }
        }
    }
    
    func fetchMatches(location: String, houseSize: String) {
        guard let tokenValue = token else { return }
        
        isFetchingMatches = true
        matchesError = nil
        matchedWorkers = []
        showMatchesSheet = true
        
        Task {
            do {
                let matches = try await NetworkManager.shared.fetchWorkerMatches(
                    location: location,
                    houseSize: houseSize,
                    token: tokenValue
                )
                await MainActor.run {
                    self.matchedWorkers = matches
                    self.isFetchingMatches = false
                }
            } catch {
                await MainActor.run {
                    self.matchesError = "Uzmanlar yüklenirken bir hata oluştu."
                    self.isFetchingMatches = false
                }
            }
        }
    }
    
    func fetchMyJobsAndOffers() async {
        guard let tokenValue = token else { return }
        
        await MainActor.run { isLoadingOffers = true }
        
        do {
            let allJobs = try await NetworkManager.shared.fetchJobs(token: tokenValue)
            let userResponse = try await fetchCurrentUserId(token: tokenValue)
            let filtered = allJobs.filter { $0.userId == userResponse.id }
            
            var detailedJobs: [Job] = []
            for job in filtered {
                do {
                    let detailedJob = try await NetworkManager.shared.fetchJobById(jobId: job.id, token: tokenValue)
                    detailedJobs.append(detailedJob)
                } catch {
                    detailedJobs.append(job)
                }
            }
            
            await MainActor.run {
                self.myJobs = detailedJobs
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
    
    func completeJob(job: Job, offer: Offer) {
        guard let tokenValue = token else { return }
        
        isCompletingJob = true
        
        Task {
            do {
                _ = try await NetworkManager.shared.completeJob(jobId: job.id, token: tokenValue)
                await MainActor.run {
                    self.isCompletingJob = false
                    self.completeAlertMessage = "İş tamamlandı! Lütfen çalışanı değerlendirin."
                    self.selectedOfferForReview = offer
                    self.showCompleteAlert = true
                }
            } catch {
                print("❌ Failed to complete job: \(error)")
                await MainActor.run {
                    self.isCompletingJob = false
                    self.completeAlertMessage = "İş tamamlanırken bir hata oluştu."
                    self.showCompleteAlert = true
                }
            }
        }
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
    
    @ViewBuilder
    private func jobStatusBadge(_ status: JobStatus) -> some View {
        let (text, color) = jobStatusDetails(status)
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(5)
    }
    
    private func jobStatusDetails(_ status: JobStatus) -> (String, Color) {
        switch status {
        case .open: return ("AÇIK", .green)
        case .inProgress: return ("DEVAM EDİYOR", .blue)
        case .completed: return ("TAMAMLANDI", .gray)
        case .cancelled: return ("İPTAL EDİLDİ", .red)
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
    var onSuccess: (String, String, Int) -> Void
    
    @AppStorage("token") var token: String?
    @State private var createdJobId: Int? = nil
    
    @StateObject private var locationService = LocationService()
    
    @State private var selectedCity = "İstanbul"
    @State private var selectedDistrict = "Kadıköy"
    @State private var houseSize = "medium"
    @State private var hasPet = false
    @State private var allergyInfo = ""
    @State private var budget = ""
    @State private var cleaningType = "Genel Temizlik"
    @State private var preferredDate = Date()
    @State private var hasAllergies = false
    @State private var specialNotes = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    // Search sheet triggers
    @State private var showCitySearchSheet = false
    @State private var showDistrictSearchSheet = false
    
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255)
    
    private let turkeyCities: [String: [String]] = [
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
    
    private var cityItems: [String] {
        if locationService.provinces.isEmpty {
            return turkeyCities.keys.sorted()
        } else {
            return locationService.provinces.map { $0.name }
        }
    }
    
    private var districtItems: [String] {
        if locationService.provinces.isEmpty {
            return turkeyCities[selectedCity] ?? []
        } else {
            return locationService.districts.map { $0.name }
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Hızlı Eşleşme Formu")) {
                    HStack {
                        Text("Şehir")
                        Spacer()
                        if locationService.isLoading && locationService.provinces.isEmpty {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: domesticRed))
                        } else {
                            Text(selectedCity)
                                .foregroundColor(.gray)
                        }
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.gray.opacity(0.5))
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        if !(locationService.isLoading && locationService.provinces.isEmpty) {
                            showCitySearchSheet = true
                        }
                    }
                    
                    HStack {
                        Text("İlçe")
                        Spacer()
                        if selectedDistrict == "Seçiniz..." {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: domesticRed))
                        } else {
                            Text(selectedDistrict)
                                .foregroundColor(.gray)
                        }
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.gray.opacity(0.5))
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        if selectedDistrict != "Seçiniz..." {
                            showDistrictSearchSheet = true
                        }
                    }
                    
                    Picker("Ev Büyüklüğü", selection: $houseSize) {
                        Text("Küçük").tag("small")
                        Text("Orta").tag("medium")
                        Text("Büyük").tag("large")
                    }
                    
                    Toggle("Evcil Hayvan Var mı?", isOn: $hasPet)
                    
                    TextField("Alerji Bilgisi (Opsiyonel)", text: $allergyInfo)
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
                    
                    Toggle("Alerjim Var (\(hasAllergies ? "Evet" : "Hayır"))", isOn: $hasAllergies)
                    
                    TextField("Özel Notlar (Opsiyonel)", text: $specialNotes)
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
                    .background(isLoading ? Color.gray : domesticRed)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(isLoading)
                }
            }
            .navigationTitle("Hızlı Eşleşme")
            .navigationBarItems(leading: Button("İptal") { isPresented = false })
            .alert(isSuccess ? "Başarılı" : "Hata", isPresented: $showAlert) {
                Button("Tamam") {
                    if isSuccess {
                        isPresented = false
                        onSuccess("\(selectedCity), \(selectedDistrict)", houseSize, createdJobId ?? 0)
                    }
                }
            } message: {
                Text(alertMessage)
            }
            .sheet(isPresented: $showCitySearchSheet) {
                SearchableItemSelectionSheet(
                    title: "Şehir Seçiniz",
                    placeholder: "Şehir ara...",
                    items: cityItems,
                    selectedItem: $selectedCity
                ) { newCity in
                    if !locationService.provinces.isEmpty {
                        if let province = locationService.provinces.first(where: { $0.name == newCity }) {
                            selectedDistrict = "Seçiniz..."
                            locationService.fetchDistricts(provinceId: province.id)
                        }
                    } else {
                        if let districts = turkeyCities[newCity], let firstDistrict = districts.first {
                            selectedDistrict = firstDistrict
                        }
                    }
                }
            }
            .sheet(isPresented: $showDistrictSearchSheet) {
                SearchableItemSelectionSheet(
                    title: "İlçe Seçiniz",
                    placeholder: "İlçe ara...",
                    items: districtItems,
                    selectedItem: $selectedDistrict
                )
            }
            .onAppear {
                locationService.fetchProvinces()
            }
            .onChange(of: locationService.provinces) { newProvinces in
                if let province = newProvinces.first(where: { $0.name == selectedCity }) {
                    locationService.fetchDistricts(provinceId: province.id)
                }
            }
            .onChange(of: locationService.districts) { newDistricts in
                if selectedDistrict == "Seçiniz...", let first = newDistricts.first {
                    selectedDistrict = first.name
                }
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
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateStr = dateFormatter.string(from: preferredDate)
        
        let petsText = hasPet ? "Var" : "Yok"
        let allergyText = hasAllergies ? "Evet" : "Hayır"
        
        let locationStr = "\(selectedCity), \(selectedDistrict)"
        let combinedDescription = "Hızlı Eşleşme Talebi (Alerji Detayı: \(allergyInfo)) | Temizlik: \(cleaningType) | Tarih: \(dateStr) | Evcil Hayvan: \(petsText) | Alerji: \(allergyText) | Not: \(specialNotes)"
        
        Task {
            do {
                let job = try await NetworkManager.shared.createJob(
                    title: "Hızlı Eşleşme Talebi",
                    description: combinedDescription,
                    location: locationStr,
                    houseSize: houseSize,
                    price: price,
                    serviceType: "DIRECT_BOOKING",
                    token: tokenValue
                )
                
                await MainActor.run {
                    self.createdJobId = job.id
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
    let jobStatus: JobStatus
    let accentColor: Color
    let onAction: (String) -> Void
    let onReview: () -> Void
    let onComplete: () -> Void
    
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
            
            if offer.status == .accepted {
                Divider()
                    .padding(.vertical, 4)
                
                if jobStatus == .inProgress {
                    Button(action: onComplete) {
                        HStack {
                            Image(systemName: "checkmark.seal.fill")
                            Text("İşi Tamamla")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color(red: 230/255, green: 57/255, blue: 70/255))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                } else if jobStatus == .completed || jobStatus == .open {
                    let isReviewed = offer.reviews != nil && !offer.reviews!.isEmpty
                    
                    Button(action: onReview) {
                        HStack {
                            Image(systemName: "sparkles")
                            Text(isReviewed ? "Değerlendirildi" : "Değerlendir")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(isReviewed ? Color.gray.opacity(0.15) : accentColor)
                        .foregroundColor(isReviewed ? .secondary : .white)
                        .cornerRadius(10)
                    }
                    .disabled(isReviewed)
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

// MARK: - Matching Sheets & Views
struct WorkerMatchesSheet: View {
    @Binding var isPresented: Bool
    let workers: [WorkerMatch]
    let isLoading: Bool
    let errorMessage: String?
    let jobId: Int
    
    @AppStorage("token") var token: String?
    
    @State private var showAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var isSendingRequest = false
    
    @State private var selectedWorkerForProfile: WorkerMatch? = nil
    
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255)
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading {
                    VStack(spacing: 15) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: domesticRed))
                            .scaleEffect(1.5)
                        Text("En uygun uzmanlar aranıyor...")
                            .foregroundColor(.secondary)
                            .font(.subheadline)
                    }
                    .frame(maxHeight: .infinity)
                } else if let error = errorMessage {
                    VStack(spacing: 15) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.largeTitle)
                            .foregroundColor(.red)
                        Text(error)
                            .foregroundColor(.secondary)
                            .font(.subheadline)
                    }
                    .frame(maxHeight: .infinity)
                } else if workers.isEmpty {
                    VStack(spacing: 15) {
                        Image(systemName: "person.crop.circle.badge.exclamationmark")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("Uygun uzman bulunamadı")
                            .font(.headline)
                            .fontWeight(.bold)
                        Text("Lütfen konum veya ev büyüklüğü tercihinizi değiştirip tekrar deneyin.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(workers) { worker in
                                WorkerMatchCard(worker: worker, accentColor: domesticRed) {
                                    sendDirectRequest(to: worker)
                                } onViewProfile: {
                                    self.selectedWorkerForProfile = worker
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Kriterinize Uygun Uzmanlar")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(leading: Button(action: { isPresented = false }) {
                HStack(spacing: 5) {
                    Image(systemName: "chevron.left")
                    Text("Geri Dön")
                }
                .foregroundColor(domesticRed)
                .bold()
            })
            .alert(alertTitle, isPresented: $showAlert) {
                Button("Tamam", role: .cancel) {
                    if alertTitle == "Başarılı" {
                        isPresented = false
                    }
                }
            } message: {
                Text(alertMessage)
            }
            .sheet(item: $selectedWorkerForProfile) { worker in
                                WorkerProfileView(worker: worker, jobId: jobId)
                            }
        }
    }
    
    private func sendDirectRequest(to worker: WorkerMatch) {
        guard let tokenValue = token else {
            alertTitle = "Hata"
            alertMessage = "Lütfen önce giriş yapın."
            showAlert = true
            return
        }
        
        isSendingRequest = true
        
        Task {
            do {
                try await NetworkManager.shared.createDirectRequest(
                    workerId: worker.id,
                    jobId: jobId,
                    token: tokenValue
                )
                await MainActor.run {
                    isSendingRequest = false
                    alertTitle = "Başarılı"
                    alertMessage = "\(worker.name)'ya talep gönderildi!"
                    showAlert = true
                }
            } catch {
                await MainActor.run {
                    isSendingRequest = false
                    alertTitle = "Hata"
                    alertMessage = "Talep gönderilemedi."
                    showAlert = true
                }
            }
        }
    }
}

struct WorkerMatchCard: View {
    let worker: WorkerMatch
    let accentColor: Color
    let onSelect: () -> Void
    let onViewProfile: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                // Profile Photo or Initial
                if let photoURL = worker.photoURL,
                   let uiImage = parseBase64Image(photoURL) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 50, height: 50)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.gray.opacity(0.1), lineWidth: 1))
                } else {
                    Text(String(worker.name.prefix(1)).uppercased())
                        .font(.title3)
                        .fontWeight(.black)
                        .foregroundColor(.gray)
                        .frame(width: 50, height: 50)
                        .background(Color(.systemGray6))
                        .clipShape(Circle())
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(worker.name)
                        .font(.headline)
                        .fontWeight(.bold)
                    
                    // Rating Stars
                    HStack(spacing: 2) {
                        let val = worker.rating ?? 5.0
                        ForEach(1...5, id: \.self) { i in
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .foregroundColor(Double(i) <= val ? .yellow : .gray.opacity(0.3))
                        }
                        Text(String(format: "%.1f", val))
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)
                    }
                }
                
                Spacer()
            }
            
            Divider()
                .padding(.vertical, 2)
            
            // Details
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Konum:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(worker.location ?? "Belirtilmedi")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                if let skills = worker.skills, !skills.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Beceriler:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(skills, id: \.self) { skill in
                                    Text(skill)
                                        .font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.1))
                                        .foregroundColor(Color(red: 30/255, green: 58/255, blue: 138/255))
                                        .cornerRadius(6)
                                }
                            }
                        }
                    }
                }
                
                if let bio = worker.bio, !bio.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Hakkımda:")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(bio)
                            .font(.footnote)
                            .foregroundColor(.primary)
                            .lineLimit(3)
                            .multilineTextAlignment(.leading)
                    }
                    .padding(.top, 4)
                }
            }
            
            Divider()
                .padding(.vertical, 2)
            
            // Price and Select Button
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("SAATLİK ÜCRET")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.secondary)
                    if let rate = worker.hourlyRate {
                        Text("\(Int(rate)) TL/saat")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    } else {
                        Text("Belirtilmedi")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                HStack(spacing: 8) {
                    Button(action: onViewProfile) {
                        Text("Profili Gör")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .foregroundColor(accentColor)
                            .background(Color.white)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(accentColor, lineWidth: 1)
                            )
                    }
                    
                    Button(action: onSelect) {
                        Text("Seç")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                            .background(accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 3)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Helper Base64 Parser
func parseBase64Image(_ base64String: String) -> UIImage? {
    var cleanString = base64String
    if let range = base64String.range(of: ";base64,") {
        cleanString = String(base64String[range.upperBound...])
    }
    cleanString = cleanString.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let data = Data(base64Encoded: cleanString) else { return nil }
    return UIImage(data: data)
}

// MARK: - Searchable Item Selection Sheet
struct SearchableItemSelectionSheet: View {
    @Environment(\.presentationMode) var presentationMode
    let title: String
    let placeholder: String
    let items: [String]
    @Binding var selectedItem: String
    var onSelect: ((String) -> Void)? = nil
    
    @State private var searchText = ""
    
    private var filteredItems: [String] {
        if searchText.isEmpty {
            return items
        } else {
            return items.filter { $0.localizedCaseInsensitiveContains(searchText) }
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField(placeholder, text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding(10)
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.horizontal)
                .padding(.top, 10)
                
                // List of items
                List {
                    ForEach(filteredItems, id: \.self) { item in
                        Button(action: {
                            selectedItem = item
                            onSelect?(item)
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            HStack {
                                Text(item)
                                    .foregroundColor(.primary)
                                Spacer()
                                if item == selectedItem {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }
                .listStyle(PlainListStyle())
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(leading: Button("Kapat") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

// MARK: - Review Sheet
struct ReviewSheet: View {
    @Binding var isPresented: Bool
    let offer: Offer
    let accentColor: Color
    var onSuccess: () -> Void
    
    @AppStorage("token") var token: String?
    
    @State private var rating = 5
    @State private var comment = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Uzman Bilgileri")) {
                    HStack(spacing: 12) {
                        if let photoURL = offer.worker?.photoURL,
                           let uiImage = parseBase64Image(photoURL) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 45, height: 45)
                                .clipShape(Circle())
                        } else {
                            Image(systemName: "person.crop.circle.fill")
                                .resizable()
                                .frame(width: 45, height: 45)
                                .foregroundColor(.gray.opacity(0.3))
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(offer.worker?.name ?? "Uzman")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text("Bu uzmanla eşleşen temizlik hizmetini puanlayın.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
                
                Section(header: Text("Puanınız")) {
                    HStack(spacing: 8) {
                        Spacer()
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= rating ? "star.fill" : "star")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 36, height: 36)
                                .foregroundColor(star <= rating ? .yellow : .gray.opacity(0.3))
                                .onTapGesture {
                                    rating = star
                                }
                        }
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
                
                Section(header: Text("Yorumunuz (Opsiyonel)")) {
                    TextField("Hizmet hakkında ne düşünüyorsunuz?", text: $comment)
                        .padding(.vertical, 6)
                }
                
                Section {
                    Button(action: submitReview) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Gönder")
                                .bold()
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .padding(.vertical, 8)
                    .background(isLoading ? Color.gray : accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(isLoading)
                }
            }
            .navigationTitle("Değerlendir")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(leading: Button("İptal") { isPresented = false })
            .alert(isSuccess ? "Başarılı" : "Hata", isPresented: $showAlert) {
                Button("Tamam") {
                    if isSuccess {
                        isPresented = false
                        onSuccess()
                    }
                }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    func submitReview() {
        guard let tokenValue = token else {
            alertMessage = "Giriş yapmanız gerekiyor."
            isSuccess = false
            showAlert = true
            return
        }
        
        guard let workerId = offer.worker?.id else {
            alertMessage = "Uzman bilgisi bulunamadı."
            isSuccess = false
            showAlert = true
            return
        }
        
        isLoading = true
        
        Task {
            do {
                try await NetworkManager.shared.createReview(
                    offerId: offer.id,
                    workerId: workerId,
                    rating: rating,
                    comment: comment.isEmpty ? nil : comment,
                    token: tokenValue
                )
                
                await MainActor.run {
                    isSuccess = true
                    alertMessage = "Değerlendirmeniz alındı!"
                    showAlert = true
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    isSuccess = false
                    alertMessage = "Değerlendirme gönderilemedi."
                    showAlert = true
                    isLoading = false
                }
            }
        }
    }
}

// MARK: - Edit Job Sheet
struct EditJobSheet: View {
    @Binding var isPresented: Bool
    let job: Job
    var onSuccess: () -> Void
    
    @AppStorage("token") var token: String?
    
    @State private var title = ""
    @State private var description = ""
    @State private var location = ""
    @State private var houseSize = "medium"
    @State private var budget = ""
    @State private var status: JobStatus = .open
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    init(isPresented: Binding<Bool>, job: Job, onSuccess: @escaping () -> Void) {
        self._isPresented = isPresented
        self.job = job
        self.onSuccess = onSuccess
        
        self._title = State(initialValue: job.title)
        self._description = State(initialValue: job.description)
        self._location = State(initialValue: job.location ?? "")
        self._houseSize = State(initialValue: job.houseSize ?? "medium")
        if let price = job.price {
            self._budget = State(initialValue: String(Int(price)))
        } else {
            self._budget = State(initialValue: "")
        }
        self._status = State(initialValue: job.status)
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
                    
                    Picker("İlan Durumu", selection: $status) {
                        Text("Açık").tag(JobStatus.open)
                        Text("Devam Ediyor").tag(JobStatus.inProgress)
                        Text("Tamamlandı").tag(JobStatus.completed)
                        Text("İptal Edildi").tag(JobStatus.cancelled)
                    }
                }
                
                Section {
                    Button(action: saveJob) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Güncelle")
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
            .navigationTitle("İlanı Düzenle")
            .navigationBarItems(leading: Button("İptal") { isPresented = false })
            .alert(isSuccess ? "Başarılı" : "Hata", isPresented: $showAlert) {
                Button("Tamam") {
                    if isSuccess {
                        isPresented = false
                        onSuccess()
                    }
                }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    func saveJob() {
        guard let tokenValue = token else {
            alertMessage = "Lütfen önce giriş yapın."
            showAlert = true
            return
        }
        
        isLoading = true
        let price = Double(budget)
        
        Task {
            do {
                _ = try await NetworkManager.shared.updateJob(
                    jobId: job.id,
                    title: title,
                    description: description,
                    location: location.isEmpty ? nil : location,
                    houseSize: houseSize,
                    price: price,
                    token: tokenValue
                )
                
                _ = try await NetworkManager.shared.updateJobStatus(
                    jobId: job.id,
                    status: status.rawValue,
                    token: tokenValue
                )
                
                await MainActor.run {
                    isSuccess = true
                    alertMessage = "İlanınız güncellendi!"
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

// MARK: - Identifiable Int Wrapper
struct IdentifiableInt: Identifiable {
    let id: Int
}

struct MiniStatCard: View {
    let title: String
    let value: String
    let iconName: String
    let iconColor: Color
    let bgColor: Color
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(bgColor)
                    .frame(width: 40, height: 40)
                Image(systemName: iconName)
                    .foregroundColor(iconColor)
                    .font(.system(size: 18, weight: .bold))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.system(size: 18, weight: .black))
                    .foregroundColor(.primary)
            }
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 12)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 5, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.08), lineWidth: 1)
        )
    }
}
