# 🧹 Domestic – Temizlik Hizmeti Platformu

Domestic, ev asistanları ile hizmet arayan kullanıcıları bir araya getiren yenilikçi ve modern bir hizmet platformudur. Klasik temizlik platformlarından sıyrılarak esnek ve çift akışlı (pazaryeri teklif modeli + doğrudan form eşleşmesi) bir kullanıcı deneyimi sunar.

## 🚀 Özellikler

- **Çift Akışlı Kullanıcı Deneyimi:** 
  - *Hızlı Eşleşme:* Kriterlerini girerek anında en uygun ev asistanlarıyla eşleşme (Form doldurma akışı).
  - *Freelance Pazar Yeri:* İlan açarak uzmanların fiyat teklifi göndermesini bekleme (İlan oluştur ve teklif bekle akışı).
- **Rol Bazlı Gösterge Panelleri (Dashboard):** Müşteri (Customer) ve Ev Asistanı (Worker/Staff) rollerine özel izole edilmiş paneller.
- **Dinamik Yönlendirme:** Kullanıcılar kayıt olurken sistemdeki rollerini seçer ve kayıt sonrası anında ilgili dashboard'a yönlendirilirler.
- **Modern ve Premium Kullanıcı Arayüzü:** Tailwind CSS v4 mimarisiyle, `domestic-red` ve `domestic-beige` gibi özgün renk paletleri ve modern cam (glassmorphism) efektleriyle desteklenen profesyonel görünüm.

## 🛠️ Teknoloji Yığını (Tech Stack)

### Backend
- **Framework:** FastAPI (Python)
- **Veritabanı & ORM:** SQLAlchemy, Pydantic (Validasyon)
- **Kimlik Doğrulama:** JWT, OAuth2 (Rol tabanlı rota kontrolleri)

### Web (Frontend)
- **Kütüphane:** React (Vite tabanlı)
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **Yönlendirme (Routing):** React Router DOM
- **Araçlar:** Axios (Interceptor destekli)

### Mobil (iOS / Swift)
- **Framework:** SwiftUI
- **Mimari:** MVVM Pattern, NetworkManager (Network Katmanı)
- **Özellikler:** 4 Adımlı Onboarding, Rol Bazlı Kayıt/Giriş (Auth), Müşteri ve Çalışan Dashboard'ları, İlan Yönetimi ve Pazaryeri Filtreleme.
- **Entegrasyon:** Backend API ile tam uyumlu (Axios benzeri NetworkManager katmanı).

## 📁 Proje Yapısı

```
domestic-project/
├── backend/            # FastAPI tabanlı backend API
│   ├── routes/         # API endpointleri (jobs, offers, users, auth vb.)
│   ├── models.py       # SQLAlchemy Modelleri
│   ├── schemas.py      # Pydantic Şemaları
│   └── database.py     # Veritabanı bağlantısı
├── web/                # React Vite tabanlı frontend projesi
│   ├── src/
│   │   ├── api/        # Axios ve network yapılanması
│   │   ├── components/ # Yeniden kullanılabilir React UI bileşenleri
│   │   ├── context/    # Global uygulama (Auth) state yönetimi
│   │   └── pages/      # Route karşılıkları gelen sayfalar (Landing, Dashboard vb.)
├── mobile/             # Mobil uygulama (Swift vb. geliştirmeler için)
└── README.md           # Proje dokümantasyonu
```

## 🎯 Hedef
Domestic platformu; sadece bir hizmet pazarı olmanın ötesinde, kullanıcılarına güvenilir, ekonomik ve modern bir "Ev Asistanı" deneyimi sunmayı hedefler. Kesinlikle "Temizlikçi" ibaresi kullanılmaz, her detayda premium ve konforlu bir his amaçlanmıştır.
