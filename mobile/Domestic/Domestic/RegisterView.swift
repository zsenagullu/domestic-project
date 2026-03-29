import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var registrationSuccess = false
    
    // Geçici olarak onboarding'den gelen rolü alıyoruz veya default veriyoruz
    @AppStorage("selectedRole") var selectedRole: String = "customer"

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Yeni Hesap Oluştur")
                    .font(.largeTitle)
                    .bold()
                    .padding(.top, 40)
                
                Text(selectedRole == "customer" ? "Müşteri Hesabı" : "Ev Asistanı Hesabı")
                    .foregroundColor(.secondary)
                
                VStack(spacing: 15) {
                    TextField("Ad Soyad", text: $name)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    TextField("E-posta", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                    
                    SecureField("Şifre", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding(.horizontal)
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: register) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Kayıt Ol")
                            .bold()
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding()
                .background(Color(red: 230/255, green: 57/255, blue: 70/255))
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(isLoading)
                
                if registrationSuccess {
                    Text("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.")
                        .foregroundColor(.green)
                        .font(.caption)
                }

                Spacer()
                
                Button("Zaten hesabınız var mı? Giriş Yap") {
                    dismiss()
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
            .navigationBarItems(leading: Button("İptal") { dismiss() })
        }
    }

    func register() {
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Lütfen tüm alanları doldurun."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        let registerData: [String: Any] = [
            "name": name,
            "email": email,
            "password": password,
            "role": selectedRole
        ]
        
        guard let url = URL(string: "http://127.0.0.1:8000/api/v1/auth/register") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: registerData)
        } catch {
            errorMessage = "Data error"
            isLoading = false
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                
                if let error = error {
                    self.errorMessage = error.localizedDescription
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        self.registrationSuccess = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            dismiss()
                        }
                    } else {
                        self.errorMessage = "Kayıt hatası (Kod: \(httpResponse.statusCode))"
                    }
                }
            }
        }.resume()
    }
}
