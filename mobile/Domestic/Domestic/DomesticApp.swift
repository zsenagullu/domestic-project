//
//  DomesticApp.swift
//  Domestic
//
//  Created by SENA on 28.03.2026.
//

import SwiftUI

@main
struct DomesticApp: App {
    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    
    @State private var isCheckingSession = true

    var body: some Scene {
        WindowGroup {
            Group {
                if isCheckingSession && token != nil {
                    // Uygulama açılışında token kontrolü yapılıyor
                    VStack {
                        ProgressView()
                        Text("Oturum kontrol ediliyor...")
                            .foregroundColor(.secondary)
                            .padding(.top)
                    }
                } else if token != nil {
                    if role == "customer" {
                        CustomerDashboardView()
                    } else {
                        WorkerDashboardView()
                    }
                } else if !hasSeenOnboarding {
                    OnboardingView()
                } else {
                    LoginView()
                }
            }
            .transition(.opacity)
            .animation(.easeInOut, value: isCheckingSession)
            .animation(.easeInOut, value: token)
            .animation(.easeInOut, value: hasSeenOnboarding)
            .task {
                await validateToken()
            }
        }
    }
    
    private func validateToken() async {
        guard let currentToken = token else {
            isCheckingSession = false
            return
        }
        
        do {
            try await NetworkManager.shared.validateToken(currentToken)
            // Token geçerli ise devam et
        } catch {
            print("❌ Token geçersiz, temizleniyor: \(error.localizedDescription)")
            // 401 veya hata durumunda UserDefaults temizle ve LoginView'a yönlendir
            token = nil
            role = nil
            userName = nil
        }
        
        isCheckingSession = false
    }
}
