import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    @AppStorage("token") var token: String?
    @AppStorage("role") var role: String?
    @AppStorage("userName") var userName: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Domestic")
                    .font(.system(size: 40, weight: .black))
                    .foregroundColor(.primary)
                
                Text("Hoş geldiniz")
                    .font(.title2)
                    .foregroundColor(.secondary)
                
                TextField("E-posta", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .padding(.horizontal)
                
                SecureField("Şifre", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: login) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Giriş Yap")
                            .bold()
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding()
                .background(Color.black)
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(isLoading)
                
                NavigationLink(destination: RegisterView().navigationBarHidden(true)) {
                    Text("Hesabın yok mu? Kayıt Ol")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
                .padding(.top, 10)
                
                Spacer()
            }
            .padding(.top, 50)
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }

    func login() {
        guard !email.isEmpty, !password.isEmpty else { return }
        isLoading = true
        errorMessage = nil
        
        // Swift JSON login
        let loginData: [String: String] = [
            "email": email,
            "password": password
        ]
        
        guard let url = URL(string: "http://127.0.0.1:8000/api/v1/auth/login") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: loginData)
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
                
                guard let data = data else {
                    self.errorMessage = "No data"
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    do {
                        let authRes = try JSONDecoder().decode(AuthResponse.self, from: data)
                        // Note: Backend /auth/login returns a token, but determining role requires another fetch
                        // OR we can decode the JWT. For simplicity based on user request, 
                        // I will assume the role was passed or we fetch /users/me
                        fetchUserProfile(token: authRes.accessToken)
                    } catch {
                        self.errorMessage = "Login decoding error"
                    }
                } else {
                    self.errorMessage = "Invalid email or password"
                }
            }
        }.resume()
    }
    
    func fetchUserProfile(token: String) {
        guard let url = URL(string: "http://127.0.0.1:8000/api/v1/users/me") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let data = data {
                    do {
                        let user = try JSONDecoder().decode(User.self, from: data)
                        self.token = token
                        self.role = user.role.rawValue
                        self.userName = user.name
                    } catch {
                        self.errorMessage = "User fetch error"
                    }
                }
            }
        }.resume()
    }
}
