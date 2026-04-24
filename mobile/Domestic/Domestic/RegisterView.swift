import SwiftUI

struct RegisterView: View {
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var role: String = "customer"
    @State private var isLoading = false
    
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    let primaryRed = Color(red: 230/255, green: 57/255, blue: 70/255) // #E63946

    var body: some View {
        VStack(spacing: 20) {
            // Header / Back Button
            HStack {
                Button(action: { dismiss() }) {
                    HStack(spacing: 5) {
                        Image(systemName: "chevron.left")
                        Text("Geri")
                    }
                    .foregroundColor(primaryRed)
                    .font(.headline)
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.top, 20)
            
            Text("Domestic")
                .font(.system(size: 40, weight: .black))
                .foregroundColor(.primary)
            
            Text("Yeni Hesap Oluştur")
                .font(.title2)
                .foregroundColor(.secondary)
            
            VStack(spacing: 15) {
                TextField("Ad Soyad", text: $name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                TextField("E-posta", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .padding(.horizontal)
                
                SecureField("Şifre", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                VStack(alignment: .leading, spacing: 10) {
                    Text("Rolünüzü Seçin")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    HStack(spacing: 20) {
                        roleButton(title: "Müşteri", value: "customer")
                        roleButton(title: "Ev Asistanı", value: "worker")
                    }
                    .padding(.horizontal)
                }
                .padding(.top, 10)
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
            .background(primaryRed)
            .foregroundColor(.white)
            .cornerRadius(12)
            .padding(.horizontal)
            .padding(.top, 20)
            .disabled(isLoading || name.isEmpty || email.isEmpty || password.isEmpty)
            
            Spacer()
        }
        .alert(isPresented: $showAlert) {
            Alert(
                title: Text(isSuccess ? "Başarılı" : "Hata"),
                message: Text(alertMessage),
                dismissButton: .default(Text("Tamam")) {
                    if isSuccess {
                        dismiss()
                    }
                }
            )
        }
    }
    
    private func roleButton(title: String, value: String) -> some View {
        Button(action: { role = value }) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.bold)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(role == value ? primaryRed : Color.gray.opacity(0.1))
                .foregroundColor(role == value ? .white : .primary)
                .cornerRadius(10)
        }
    }

    func register() {
        isLoading = true
        
        let registerData: [String: String] = [
            "name": name,
            "email": email,
            "password": password,
            "role": role
        ]
        
        guard let url = URL(string: "http://127.0.0.1:8000/api/v1/auth/register") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: registerData)
        } catch {
            alertMessage = "Veri hatası"
            isSuccess = false
            showAlert = true
            isLoading = false
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                
                if let error = error {
                    self.alertMessage = error.localizedDescription
                    self.isSuccess = false
                    self.showAlert = true
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        self.alertMessage = "Kayıt başarılı! Giriş yapabilirsiniz."
                        self.isSuccess = true
                        self.showAlert = true
                    } else {
                        self.alertMessage = "Kayıt başarısız, tekrar deneyin."
                        self.isSuccess = false
                        self.showAlert = true
                    }
                }
            }
        }.resume()
    }
}

struct RegisterView_Previews: PreviewProvider {
    static var previews: some View {
        RegisterView()
    }
}
