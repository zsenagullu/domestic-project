import SwiftUI
import PhotosUI

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
            
            IncomingRequestsView(workerBlue: workerBlue)
                .tabItem {
                    Label("Gelen Talepler", systemImage: "bell.fill")
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

    @StateObject private var locationService = LocationService()
    
    @State private var fullName = ""
    @State private var selectedCity = "İstanbul"
    @State private var selectedDistrict = "Kadıköy"
    @State private var hourlyRate = ""
    @State private var selectedSkills = Set<String>()
    @State private var aboutMe = ""
    
    @State private var avatarImage: UIImage? = nil
    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    
    @State private var isLoadingProfile = false
    @State private var isSavingProfile = false
    @State private var isPhotoUploading = false
    
    @State private var showAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    
    @State private var showCitySearchSheet = false
    @State private var showDistrictSearchSheet = false
    
    let allSkills = [
        "Genel Temizlik",
        "Derin Temizlik",
        "Cam Temizliği",
        "Halı Yıkama",
        "İnşaat Sonrası Temizlik",
        "Ofis Temizliği"
    ]
    
    private var cityItems: [String] {
        if locationService.provinces.isEmpty {
            return locationService.turkeyCities.keys.sorted()
        } else {
            return locationService.provinces.map { $0.name }
        }
    }
    
    private var districtItems: [String] {
        if locationService.provinces.isEmpty {
            return locationService.turkeyCities[selectedCity] ?? []
        } else {
            return locationService.districts.map { $0.name }
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                if isLoadingProfile {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
                        Text("Profil yükleniyor...")
                            .foregroundColor(.secondary)
                    }
                } else {
                    Form {
                        // 1. Profil Fotoğrafı Bölümü
                        Section(header: Text("Profil Fotoğrafı")) {
                            HStack {
                                Spacer()
                                VStack(spacing: 12) {
                                    if isPhotoUploading {
                                        ProgressView()
                                            .frame(width: 100, height: 100)
                                    } else if let avatar = avatarImage {
                                        Image(uiImage: avatar)
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 100, height: 100)
                                            .clipShape(Circle())
                                            .overlay(Circle().stroke(workerBlue, lineWidth: 2))
                                    } else {
                                        Image(systemName: "person.crop.circle.fill")
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 100, height: 100)
                                            .foregroundColor(.gray.opacity(0.3))
                                    }
                                    
                                    PhotosPicker(selection: $selectedPhotoItem, matching: .images, photoLibrary: .shared()) {
                                        Text("Fotoğraf Değiştir")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(workerBlue)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(workerBlue.opacity(0.1))
                                            .cornerRadius(8)
                                    }
                                    .disabled(isPhotoUploading)
                                    .onChange(of: selectedPhotoItem) { newItem in
                                        if let item = newItem {
                                            Task {
                                                await uploadPhoto(item: item)
                                            }
                                        }
                                    }
                                }
                                Spacer()
                            }
                            .padding(.vertical, 8)
                        }
                        
                        // 2. Profil Formu
                        Section(header: Text("Kişisel Bilgiler")) {
                            TextField("Ad Soyad", text: $fullName)
                                .autocapitalization(.words)
                        }
                        
                        Section(header: Text("Konum Bilgileri")) {
                            HStack {
                                Text("Şehir")
                                Spacer()
                                if locationService.isLoading && locationService.provinces.isEmpty {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: workerBlue))
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
                                        .progressViewStyle(CircularProgressViewStyle(tint: workerBlue))
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
                        }
                        
                        Section(header: Text("Saatlik Ücret (TL)")) {
                            TextField("Saatlik Ücret", text: $hourlyRate)
                                .keyboardType(.numberPad)
                        }
                        
                        Section(header: Text("Beceriler")) {
                            ForEach(allSkills, id: \.self) { skill in
                                Button(action: {
                                    if selectedSkills.contains(skill) {
                                        selectedSkills.remove(skill)
                                    } else {
                                        selectedSkills.insert(skill)
                                    }
                                }) {
                                    HStack {
                                        Text(skill)
                                            .foregroundColor(.primary)
                                        Spacer()
                                        if selectedSkills.contains(skill) {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(workerBlue)
                                        } else {
                                            Image(systemName: "circle")
                                                .foregroundColor(.gray)
                                        }
                                    }
                                }
                            }
                        }
                        
                        Section(header: Text("Hakkımda")) {
                            TextEditor(text: $aboutMe)
                                .frame(minHeight: 100)
                        }
                        
                        Section {
                            Button(action: saveProfile) {
                                if isSavingProfile {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text("Profili Güncelle")
                                        .bold()
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .listRowBackground(workerBlue)
                            .disabled(isSavingProfile)
                        }
                        
                        Section {
                            Button(action: {
                                token = nil
                                role = nil
                            }) {
                                Text("Çıkış Yap")
                                    .foregroundColor(.red)
                                    .frame(maxWidth: .infinity, alignment: .center)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Profilim")
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
                        if let districts = locationService.turkeyCities[newCity], let firstDistrict = districts.first {
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
                Task {
                    await fetchProfile()
                }
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
            .alert(isPresented: $showAlert) {
                Alert(
                    title: Text(alertTitle),
                    message: Text(alertMessage),
                    dismissButton: .default(Text("Tamam"))
                )
            }
        }
    }
    
    private func fetchProfile() async {
        guard let currentToken = token else { return }
        
        await MainActor.run {
            isLoadingProfile = true
        }
        
        do {
            let profile = try await NetworkManager.shared.fetchUserProfile(token: currentToken)
            await MainActor.run {
                self.fullName = profile.name
                
                if let location = profile.location {
                    let parts = location.components(separatedBy: ", ")
                    if parts.count == 2 {
                        self.selectedCity = parts[0]
                        self.selectedDistrict = parts[1]
                    } else if !location.isEmpty {
                        self.selectedCity = location
                    }
                }
                
                if let rate = profile.hourlyRate {
                    self.hourlyRate = String(Int(rate))
                }
                
                if let skills = profile.skills {
                    self.selectedSkills = Set(skills)
                }
                
                self.aboutMe = profile.bio ?? ""
                
                if let photoStr = profile.photoURL, !photoStr.isEmpty {
                    self.avatarImage = parseBase64Image(photoStr)
                }
                
                // Fetch districts for this city
                if !locationService.provinces.isEmpty,
                   let province = locationService.provinces.first(where: { $0.name == selectedCity }) {
                    locationService.fetchDistricts(provinceId: province.id)
                }
                
                isLoadingProfile = false
            }
        } catch {
            print("❌ Failed to fetch user profile: \(error.localizedDescription)")
            await MainActor.run {
                isLoadingProfile = false
            }
        }
    }
    
    private func saveProfile() {
        guard let currentToken = token else { return }
        
        isSavingProfile = true
        
        let rate = Double(hourlyRate) ?? 0.0
        let locationStr = "\(selectedCity), \(selectedDistrict)"
        let skillsArray = Array(selectedSkills)
        let bioVal = aboutMe.isEmpty ? nil : aboutMe
        
        Task {
            do {
                let updated = try await NetworkManager.shared.updateUserProfile(
                    location: locationStr,
                    hourlyRate: rate,
                    skills: skillsArray,
                    bio: bioVal,
                    token: currentToken
                )
                
                // Update AppStorage userName locally as well
                await MainActor.run {
                    self.userName = updated.name
                    alertTitle = "Başarılı"
                    alertMessage = "Profiliniz güncellendi!"
                    showAlert = true
                    isSavingProfile = false
                }
            } catch {
                await MainActor.run {
                    alertTitle = "Hata"
                    alertMessage = "Profil güncellenirken bir hata oluştu."
                    showAlert = true
                    isSavingProfile = false
                }
            }
        }
    }
    
    private func uploadPhoto(item: PhotosPickerItem) async {
        guard let currentToken = token else { return }
        
        await MainActor.run {
            isPhotoUploading = true
        }
        
        do {
            if let data = try await item.loadTransferable(type: Data.self) {
                if let uiImage = UIImage(data: data) {
                    // Compress and convert to base64 Data URL
                    guard let jpegData = uiImage.jpegData(compressionQuality: 0.5) else { return }
                    let base64String = jpegData.base64EncodedString()
                    let dataUrl = "data:image/jpeg;base64,\(base64String)"
                    
                    let _ = try await NetworkManager.shared.uploadProfilePhoto(base64Photo: dataUrl, token: currentToken)
                    
                    await MainActor.run {
                        self.avatarImage = uiImage
                        self.isPhotoUploading = false
                        self.alertTitle = "Başarılı"
                        self.alertMessage = "Profil fotoğrafınız güncellendi!"
                        self.showAlert = true
                    }
                }
            }
        } catch {
            print("❌ Photo upload failed: \(error.localizedDescription)")
            await MainActor.run {
                self.isPhotoUploading = false
                self.alertTitle = "Hata"
                self.alertMessage = "Fotoğraf yüklenirken bir hata oluştu."
                self.showAlert = true
            }
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

// MARK: - Incoming Requests Tab
struct IncomingRequestsView: View {
    let workerBlue: Color
    @AppStorage("token") var token: String?
    @State private var requests: [DirectRequest] = []
    @State private var isLoading = false
    @State private var errorMessage: String? = nil

    var body: some View {
        NavigationView {
            ZStack {
                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
                        Text("Talepler yükleniyor...")
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
                            Task { await fetchRequests() }
                        }
                        .padding()
                        .background(workerBlue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                } else if requests.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "bell.slash.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray.opacity(0.3))
                        Text("Gelen talep bulunmuyor")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(requests) { request in
                                IncomingRequestCardView(
                                    request: request,
                                    workerBlue: workerBlue,
                                    onAccept: {
                                        updateStatus(requestId: request.id, status: "accepted")
                                    },
                                    onReject: {
                                        updateStatus(requestId: request.id, status: "rejected")
                                    }
                                )
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await fetchRequests()
                    }
                }
            }
            .navigationTitle("Gelen Talepler")
            .onAppear {
                Task { await fetchRequests() }
            }
        }
    }

    private func fetchRequests() async {
        guard let token = token else { return }
        isLoading = true
        errorMessage = nil
        do {
            requests = try await NetworkManager.shared.fetchIncomingRequests(token: token)
        } catch {
            errorMessage = "Talepler yüklenemedi"
        }
        isLoading = false
    }

    private func updateStatus(requestId: Int, status: String) {
        guard let token = token else { return }
        Task {
            do {
                try await NetworkManager.shared.updateDirectRequestStatus(
                    requestId: requestId,
                    status: status,
                    token: token
                )
                await fetchRequests()
            } catch {
                print("❌ Failed to update request status: \(error)")
            }
        }
    }
}

struct IncomingRequestCardView: View {
    let request: DirectRequest
    let workerBlue: Color
    let onAccept: () -> Void
    let onReject: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "person.circle.fill")
                        .font(.title3)
                        .foregroundColor(workerBlue)
                    Text(request.customer?.name ?? "Müşteri")
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                Spacer()
                statusBadge(request.status)
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 8) {
                if let job = request.job {
                    Text(job.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(job.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                    
                    if let location = job.location {
                        HStack(spacing: 6) {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.gray)
                            Text(location)
                                .font(.footnote)
                                .foregroundColor(.secondary)
                        }
                        .padding(.top, 2)
                    }
                    
                    if let size = job.houseSize {
                        HStack(spacing: 6) {
                            Image(systemName: "house.fill")
                                .foregroundColor(.gray)
                            Text("Ev Büyüklüğü: \(translateHouseSize(size))")
                                .font(.footnote)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    Text("İş Detayı Belirtilmedi")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                
                HStack(spacing: 6) {
                    Image(systemName: "calendar")
                        .foregroundColor(.gray)
                    Text(formatRequestDate(request.createdAt))
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 2)
            }
            
            if request.status == "pending" {
                Divider()
                    .padding(.vertical, 4)
                
                HStack(spacing: 12) {
                    Button(action: onAccept) {
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
                    
                    Button(action: onReject) {
                        HStack {
                            Image(systemName: "x.circle.fill")
                            Text("Reddet")
                        }
                        .font(.footnote)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
            }
        }
        .padding(15)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
    }
    
    private func translateHouseSize(_ size: String) -> String {
        switch size {
        case "small": return "Küçük"
        case "medium": return "Orta"
        case "large": return "Büyük"
        default: return size
        }
    }
    
    private func requestStatusDetails(_ status: String) -> (String, Color) {
        switch status {
        case "pending":
            return ("BEKLEMEDE", .orange)
        case "accepted":
            return ("KABUL EDİLDİ", .green)
        case "rejected":
            return ("REDDEDİLDİ", .red)
        default:
            return (status.uppercased(), .gray)
        }
    }
    
    @ViewBuilder
    private func statusBadge(_ status: String) -> some View {
        let details = requestStatusDetails(status)
        Text(details.0)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(details.1.opacity(0.1))
            .foregroundColor(details.1)
            .cornerRadius(5)
    }
    
    private func formatRequestDate(_ dateStr: String) -> String {
        let ISOFormatter = ISO8601DateFormatter()
        ISOFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var date = ISOFormatter.date(from: dateStr)
        if date == nil {
            let ISOFormatter2 = ISO8601DateFormatter()
            date = ISOFormatter2.date(from: dateStr)
        }
        
        if date == nil {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            formatter.locale = Locale(identifier: "en_US_POSIX")
            date = formatter.date(from: dateStr)
        }
        
        guard let parsedDate = date else {
            return dateStr
        }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "dd.MM.yyyy HH:mm"
        displayFormatter.locale = Locale(identifier: "tr_TR")
        return displayFormatter.string(from: parsedDate)
    }
}

struct WorkerDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        WorkerDashboardView()
    }
}
