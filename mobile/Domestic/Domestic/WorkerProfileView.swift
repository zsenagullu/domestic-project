import SwiftUI

struct WorkerProfileView: View {
    let worker: WorkerMatch
    let jobId: Int?
    
    @Environment(\.presentationMode) var presentationMode
    @AppStorage("token") var token: String?
    
    @State private var detailedWorker: User? = nil
    @State private var stats: WorkerStats? = nil
    @State private var reviews: [Review] = []
    @State private var isLoading = true
    @State private var errorMessage: String? = nil
    
    // Action Alert States
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var showAlert = false
    @State private var isSendingRequest = false
    
    private let domesticRed = Color(red: 230/255, green: 57/255, blue: 70/255)
    
    // Computed properties for immediate display fallback
    private var displayName: String { detailedWorker?.name ?? worker.name }
    private var displayLocation: String? { detailedWorker?.location ?? worker.location }
    private var displayRating: Double { worker.rating ?? 5.0 }
    private var displayBio: String? { detailedWorker?.bio ?? worker.bio }
    private var displaySkills: [String] { detailedWorker?.skills ?? worker.skills ?? [] }
    private var displayHourlyRate: Double? { detailedWorker?.hourlyRate ?? worker.hourlyRate }
    private var displayPhotoURL: String? { detailedWorker?.photoURL ?? worker.photoURL }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            // Upper Section: Card details
                            VStack(spacing: 16) {
                                // Photo / Avatar
                                if let photoURL = displayPhotoURL,
                                   let uiImage = parseBase64Image(photoURL) {
                                    Image(uiImage: uiImage)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 90, height: 90)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(Color.gray.opacity(0.15), lineWidth: 2))
                                } else {
                                    Text(String(displayName.prefix(1)).uppercased())
                                        .font(.system(size: 36, weight: .black))
                                        .foregroundColor(.gray)
                                        .frame(width: 90, height: 90)
                                        .background(Color(.systemGray6))
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(Color.gray.opacity(0.15), lineWidth: 2))
                                }
                                
                                // Name & Location
                                VStack(spacing: 4) {
                                    Text(displayName)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                    
                                    if let location = displayLocation {
                                        HStack(spacing: 4) {
                                            Image(systemName: "mappin.circle.fill")
                                                .foregroundColor(domesticRed)
                                            Text(location)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                                
                                // Stars Rating
                                HStack(spacing: 3) {
                                    let ratingVal = displayRating
                                    ForEach(1...5, id: \.self) { i in
                                        Image(systemName: "star.fill")
                                            .font(.subheadline)
                                            .foregroundColor(Double(i) <= ratingVal ? .yellow : .gray.opacity(0.3))
                                    }
                                    Text(String(format: "%.1f", ratingVal))
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.secondary)
                                        .padding(.leading, 5)
                                }
                                
                                Divider()
                                    .padding(.vertical, 4)
                                
                                // Bio/Hakkımda
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("HAKKIMDA")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.secondary)
                                    
                                    Text(displayBio ?? "Bu uzman henüz hakkında kısmını doldurmadı.")
                                        .font(.body)
                                        .foregroundColor(.primary)
                                        .italic(displayBio == nil)
                                        .multilineTextAlignment(.leading)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding(.horizontal, 5)
                                
                                // Skills
                                let skills = displaySkills
                                if !skills.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("BECERİLER")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.secondary)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                        
                                        FlowLayout(items: skills) { skill in
                                            Text(skill)
                                                .font(.system(size: 11, weight: .bold))
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 5)
                                                .background(Color.blue.opacity(0.1))
                                                .foregroundColor(Color(red: 30/255, green: 58/255, blue: 138/255))
                                                .cornerRadius(8)
                                        }
                                    }
                                    .padding(.horizontal, 5)
                                }
                                
                                Divider()
                                    .padding(.vertical, 4)
                                
                                // Stats & Price Grid
                                HStack(spacing: 15) {
                                    // Hourly rate
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("SAATLİK ÜCRET")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(.secondary)
                                        if let rate = displayHourlyRate {
                                            Text("\(Int(rate)) TL/saat")
                                                .font(.headline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.green)
                                        } else {
                                            Text("Belirtilmedi")
                                                .font(.headline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding()
                                    .background(Color(.secondarySystemBackground))
                                    .cornerRadius(12)
                                    
                                    // Completed jobs count
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("TAMAMLANAN İŞ")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(.secondary)
                                        if isLoading {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: domesticRed))
                                        } else {
                                            let count = stats?.completedJobsCount ?? 0
                                            Text("\(count) İş")
                                                .font(.headline)
                                                .fontWeight(.bold)
                                                .foregroundColor(domesticRed)
                                        }
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding()
                                    .background(Color(.secondarySystemBackground))
                                    .cornerRadius(12)
                                }
                            }
                            .padding(20)
                            .background(Color.white)
                            .cornerRadius(20)
                            .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 3)
                            
                            // Lower Section: Reviews
                            VStack(alignment: .leading, spacing: 15) {
                                HStack {
                                    Image(systemName: "message.fill")
                                        .foregroundColor(domesticRed)
                                    Text("Müşteri Yorumları (\(reviews.count))")
                                        .font(.headline)
                                        .fontWeight(.bold)
                                }
                                .padding(.horizontal, 5)
                                
                                if isLoading {
                                    VStack {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: domesticRed))
                                            .scaleEffect(1.2)
                                            .padding()
                                    }
                                    .frame(maxWidth: .infinity)
                                } else if reviews.isEmpty {
                                    VStack(spacing: 10) {
                                        Image(systemName: "bubble.left.and.bubble.right")
                                            .font(.system(size: 32))
                                            .foregroundColor(.gray.opacity(0.3))
                                        Text("Henüz yorum yok")
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 30)
                                    .background(Color.white)
                                    .cornerRadius(16)
                                } else {
                                    VStack(spacing: 12) {
                                        ForEach(reviews) { review in
                                            VStack(alignment: .leading, spacing: 8) {
                                                HStack {
                                                    HStack(spacing: 6) {
                                                        Text(String(review.reviewer?.name.prefix(1) ?? "M").uppercased())
                                                            .font(.caption)
                                                            .fontWeight(.bold)
                                                            .frame(width: 24, height: 24)
                                                            .background(Color(.systemGray5))
                                                            .clipShape(Circle())
                                                        
                                                        Text(review.reviewer?.name ?? "Müşteri")
                                                            .font(.footnote)
                                                            .fontWeight(.bold)
                                                    }
                                                    Spacer()
                                                    
                                                    Text(review.createdAt.prefix(10))
                                                        .font(.caption2)
                                                        .foregroundColor(.secondary)
                                                }
                                                
                                                HStack(spacing: 2) {
                                                    ForEach(1...5, id: \.self) { i in
                                                        Image(systemName: "star.fill")
                                                            .font(.system(size: 10))
                                                            .foregroundColor(i <= review.rating ? .yellow : .gray.opacity(0.3))
                                                    }
                                                }
                                                
                                                if let comment = review.comment, !comment.isEmpty {
                                                    Text(comment)
                                                        .font(.footnote)
                                                        .foregroundColor(.secondary)
                                                        .italic()
                                                }
                                            }
                                            .padding(15)
                                            .background(Color.white)
                                            .cornerRadius(16)
                                            .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 2)
                                        }
                                    }
                                }
                            }
                        }
                        .padding()
                    }
                    
                    // "Talep Gönder" sticky footer button
                    if jobId != nil {
                        VStack {
                            Button(action: sendDirectRequest) {
                                if isSendingRequest {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text("Talep Gönder")
                                        .font(.headline)
                                        .fontWeight(.bold)
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .padding()
                            .background(domesticRed)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                            .disabled(isSendingRequest)
                            .padding()
                        }
                        .background(Color.white)
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: -2)
                    }
                }
            }
            .navigationTitle("Uzman Profili")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(leading: Button(action: { presentationMode.wrappedValue.dismiss() }) {
                HStack(spacing: 5) {
                    Image(systemName: "chevron.left")
                    Text("Geri")
                }
                .foregroundColor(domesticRed)
                .bold()
            })
            .onAppear {
                fetchProfileAndDetails()
            }
            .alert(alertTitle, isPresented: $showAlert) {
                Button("Tamam", role: .cancel) {
                    if alertTitle == "Başarılı" {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    private func fetchProfileAndDetails() {
        isLoading = true
        errorMessage = nil
        
        Task {
            // Fetch stats and reviews in parallel or sequentially.
            async let detailsTask = try? NetworkManager.shared.fetchUserById(userId: worker.id)
            async let statsTask = try? NetworkManager.shared.fetchWorkerStats(workerId: worker.id)
            async let reviewsTask = try? NetworkManager.shared.fetchWorkerReviews(workerId: worker.id)
            
            let details = await detailsTask
            let statsRes = await statsTask
            let reviewsRes = await reviewsTask
            
            await MainActor.run {
                if let details = details {
                    self.detailedWorker = details
                }
                if let statsRes = statsRes {
                    self.stats = statsRes
                }
                if let reviewsRes = reviewsRes {
                    self.reviews = reviewsRes
                }
                self.isLoading = false
            }
        }
    }
    
    private func sendDirectRequest() {
        guard let tokenValue = token else {
            alertTitle = "Hata"
            alertMessage = "Lütfen önce giriş yapın."
            showAlert = true
            return
        }
        
        guard let jobId = jobId else {
            alertTitle = "Hata"
            alertMessage = "İlan bilgisi bulunamadı."
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
                    alertMessage = "\(displayName)'ya talep gönderildi!"
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

// FlowLayout helper for skills tags
struct FlowLayout<Content: View>: View {
    let items: [String]
    let spacing: CGFloat = 8
    let content: (String) -> Content
    
    @State private var totalHeight = CGFloat.zero
    
    var body: some View {
        VStack {
            GeometryReader { geometry in
                self.generateContent(in: geometry)
            }
        }
        .frame(height: totalHeight)
    }
    
    private func generateContent(in g: GeometryProxy) -> some View {
        var width = CGFloat.zero
        var height = CGFloat.zero
        
        return ZStack(alignment: .topLeading) {
            ForEach(self.items, id: \.self) { item in
                self.content(item)
                    .padding([.horizontal, .vertical], 4)
                    .alignmentGuide(.leading, computeValue: { d in
                        if (abs(width - d.width) > g.size.width) {
                            width = 0
                            height -= d.height
                        }
                        let result = width
                        if item == self.items.last! {
                            width = 0 // last item
                        } else {
                            width -= d.width
                        }
                        return result
                    })
                    .alignmentGuide(.top, computeValue: { d in
                        let result = height
                        if item == self.items.last! {
                            height = 0 // last item
                        }
                        return result
                    })
            }
        }
        .background(viewHeightReader($totalHeight))
    }
    
    private func viewHeightReader(_ binding: Binding<CGFloat>) -> some View {
        return GeometryReader { geo in
            Color.clear
                .preference(key: HeightPreferenceKey.self, value: geo.frame(in: .local).size.height)
        }
        .onPreferenceChange(HeightPreferenceKey.self) { h in
            binding.wrappedValue = h
        }
    }
}

struct HeightPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}
