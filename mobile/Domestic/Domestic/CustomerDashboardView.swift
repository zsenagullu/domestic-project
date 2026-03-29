import SwiftUI

struct CustomerDashboardView: View {
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?
    
    @State private var showComingSoonAlert = false
    @State private var showCreateJobSheet = false
    @State private var showDirectBookingSheet = false
    
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
                
                Spacer(minLength: 50)
                
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
