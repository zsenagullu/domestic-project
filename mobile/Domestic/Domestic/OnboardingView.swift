import SwiftUI

struct OnboardingStep {
    let icon: String
    let title: String
    let description: String
    let color: Color
}

struct OnboardingView: View {
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @AppStorage("selectedRole") var selectedRole: String = ""
    
    @State private var currentStep = 0
    @State private var showingRoleSelection = false
    @State private var showingActionSheet = false
    @State private var showingRegisterSheet = false
    @State private var pendingRole: String = ""

    init() {
        UIPageControl.appearance().currentPageIndicatorTintColor = UIColor(red: 0.9, green: 0.22, blue: 0.27, alpha: 1)
        UIPageControl.appearance().pageIndicatorTintColor = UIColor.lightGray
    }
    
    let steps = [
        OnboardingStep(icon: "person.2.fill", title: "Rolünü Seç", description: "İster hizmet arayan ol, ister ev asistanı olarak uzmanlığını sergile.", color: Color(red: 230/255, green: 57/255, blue: 70/255)),
        OnboardingStep(icon: "pencil", title: "İhtiyacını veya Hizmetini Belirt", description: "Müşteriler kriterlerini girip hizmet talebini ulaştırırken, asistanlar uzmanlık profilini öne çıkartır.", color: Color(red: 30/255, green: 58/255, blue: 138/255)),
        OnboardingStep(icon: "message.fill", title: "Eşleşme ve Teklifler", description: "Akıllı sistem sayesinde en uygun uzmanla hemen eşleşin veya freelance teklifleri değerlendirin.", color: Color(hex: "34C759")),
        OnboardingStep(icon: "star.fill", title: "Hizmet ve Değerlendirme", description: "İşlem pürüzsüzce gerçekleşsin, karşılıklı puanlama ve yorumlarla güven inşa edin.", color: Color(red: 255/255, green: 214/255, blue: 10/255))
    ]
    
    var body: some View {
        ZStack {
            Color.white.edgesIgnoringSafeArea(.all)
            
            if !showingRoleSelection {
                stage1Intro
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
            } else {
                stage2RoleSelection
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.spring(), value: showingRoleSelection)
        .confirmationDialog("\(pendingRole == "customer" ? "Müşteri" : "Ev Asistanı") olarak devam et", isPresented: $showingActionSheet, titleVisibility: .visible) {
            Button("Giriş Yap") {
                selectedRole = pendingRole
                hasSeenOnboarding = true
            }
            Button("Kayıt Ol") {
                selectedRole = pendingRole
                showingRegisterSheet = true
            }
            Button("İptal", role: .cancel) {}
        }
        .sheet(isPresented: $showingRegisterSheet) {
            RegisterView()
                .onDisappear {
                    if selectedRole != "" { // Registration success might set this or we keep it
                        hasSeenOnboarding = true
                    }
                }
        }
    }
    
    // MARK: - Stage 1: Intro Swipe
    private var stage1Intro: some View {
        VStack(spacing: 0) {
            headerLogo
            
            TabView(selection: $currentStep) {
                ForEach(0..<steps.count, id: \.self) { index in
                    VStack(spacing: 30) {
                        Spacer()
                        
                        ZStack {
                            Circle()
                                .fill(steps[index].color.opacity(0.1))
                                .frame(width: 120, height: 120)
                            
                            Image(systemName: steps[index].icon)
                                .font(.system(size: 50))
                                .foregroundColor(steps[index].color)
                        }
                        .padding(.bottom, 20)
                        
                        Text(steps[index].title)
                            .font(.system(size: 28, weight: .bold))
                            .multilineTextAlignment(.center)
                        
                        Text(steps[index].description)
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                        
                        Spacer()
                    }
                    .tag(index)
                    // Disable tap navigation explicitly by adding highPriorityGesture to capture but do nothing
                    .contentShape(Rectangle())
                    .onTapGesture {}
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(.page(backgroundDisplayMode: .always))
            
            // Fixed bottom button
            VStack {
                if currentStep == steps.count - 1 {
                    Button(action: {
                        withAnimation {
                            showingRoleSelection = true
                        }
                    }) {
                        HStack {
                            Text("Hemen Başla")
                            Image(systemName: "arrow.right")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color(red: 230/255, green: 57/255, blue: 70/255))
                        .cornerRadius(15)
                        .padding(.horizontal, 40)
                    }
                    .transition(.opacity.combined(with: .scale))
                } else {
                    // Transparent element to reserve space
                    Color.clear.frame(height: 50)
                }
            }
            .frame(height: 100)
            .padding(.bottom, 30)
        }
    }
    
    // MARK: - Stage 2: Role Selection
    private var stage2RoleSelection: some View {
        VStack(spacing: 30) {
            headerLogo
            
            VStack(spacing: 12) {
                Text("Nasıl başlamak istersin?")
                    .font(.system(size: 32, weight: .black))
                    .multilineTextAlignment(.center)
                
                Text("Sana en uygun deneyimi sunabilmemiz için rolünü seç.")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .padding(.top, 20)
            
            VStack(spacing: 20) {
                roleCard(
                    title: "Müşteri",
                    description: "Profesyonel bir ev asistanı veya temizlik uzmanı arıyorum.",
                    icon: "house.fill",
                    color: Color(red: 230/255, green: 57/255, blue: 70/255),
                    role: "customer"
                )
                
                roleCard(
                    title: "Ev Asistanı",
                    description: "Freelance çalışarak hizmet vermek, kendi saatlerimi belirlemek istiyorum.",
                    icon: "briefcase.fill",
                    color: Color(red: 30/255, green: 58/255, blue: 138/255),
                    role: "worker"
                )
            }
            .padding(.horizontal, 25)
            
            Spacer()
        }
    }
    
    // MARK: - Components
    private var headerLogo: some View {
        Text("Domestic.")
            .font(.system(size: 24, weight: .black))
            .foregroundColor(Color(red: 230/255, green: 57/255, blue: 70/255))
            .padding(.top, 20)
    }
    
    private func roleCard(title: String, description: String, icon: String, color: Color, role: String) -> some View {
        Button(action: {
            pendingRole = role
            showingActionSheet = true
        }) {
            HStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.1))
                        .frame(width: 70, height: 70)
                    
                    Image(systemName: icon)
                        .font(.title)
                        .foregroundColor(color)
                }
                
                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color.opacity(0.1), lineWidth: 1)
            )
        }
    }
}
