import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

def analyze_voice_command(text: str) -> str:
    """
    Analyzes user's cleaning service request. 
    Uses Gemini AI if available, otherwise falls back to keyword analysis.
    """
    from datetime import datetime, timedelta
    
    # 1. Try Gemini AI
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and "your_real" not in api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""
            Sen bir ev temizliği hizmeti platformunun AI asistanısın. Kullanıcının Türkçe mesajını analiz ederek aşağıdaki JSON formatında yanıt ver.

            ÖNEMLI KURALLAR:
            - location: Metinde geçen şehir veya semt adını yaz
            - house_size: Oda sayısına göre belirle (1-2 oda: small, 3-4 oda: medium, 5+: large)
            - estimated_price: Metinde fiyat varsa onu yaz, yoksa house_size'a göre tahmin et (small:300, medium:500, large:800)
            - service_type: Kullanıcı fiyat vermişse MARKETPLACE_BIDDING, acil ise DIRECT_BOOKING
            - cleaning_type: Genel Temizlik, Derin Temizlik, Cam Temizliği, Halı Yıkama, İnşaat Sonrası Temizlik, Ofis Temizliği değerlerinden birini seç.
            - preferred_date: Metinden anlaşılan tarihi YYYY-MM-DD formatında yaz (yarın diyorsa bugünün tarihine +1 gün ekle, belirtilmemişse boş string yaz). Bugünün tarihi: {datetime.utcnow().strftime("%Y-%m-%d")}.
            - has_pets: Evcil hayvan belirtilmişse true, aksi halde false.
            - has_allergies: Alerji veya toz hassasiyeti belirtilmişse true, aksi halde false.
            - special_notes: Varsa diğer notları/istekleri yaz, yoksa boş string.

            Sadece JSON döndür, başka hiçbir şey yazma:
            {{
              "location": "...",
              "house_size": "small/medium/large",
              "estimated_price": sayı,
              "description": "...",
              "service_type": "DIRECT_BOOKING/MARKETPLACE_BIDDING",
              "cleaning_type": "Genel Temizlik / Derin Temizlik / ...",
              "preferred_date": "YYYY-MM-DD",
              "has_pets": true/false,
              "has_allergies": true/false,
              "special_notes": "..."
            }}

            Kullanıcı mesajı: [{text}]
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            raw_text = response.text.strip()
            
            # Clean markdown code blocks
            clean_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            # Validate and return
            result = json.loads(clean_text)
            return json.dumps(result, ensure_ascii=False)
            
        except Exception as e:
            print(f"Gemini AI failed, using fallback keyword analysis: {e}")

    # 2. Keyword Analysis (Fallback)
    text_lower = text.lower()
    cities = ["ankara", "istanbul", "izmir", "bursa", 
              "antalya", "adana", "konya", "çankaya",
              "kadıköy", "beşiktaş", "mersin", "gaziantep"]
    
    found_city = next((c for c in cities if c in text_lower), None)
    if found_city == "çankaya" and "ankara" in text_lower:
        location = "Ankara Çankaya"
    elif found_city:
        location = found_city.title()
    else:
        location = "Belirtilmedi"
    
    if any(x in text_lower for x in ["1 oda", "2 oda", "küçük", "stüdyo", "1+0", "1+1"]):
        house_size, base_price = "small", 300
    elif any(x in text_lower for x in ["3 oda", "4 oda", "orta", "2+1", "3+1"]):
        house_size, base_price = "medium", 500
    elif any(x in text_lower for x in ["5 oda", "6 oda", "büyük", "villa", "4+1", "dubleks"]):
        house_size, base_price = "large", 800
    else:
        house_size, base_price = "medium", 500
    
    price_match = re.search(r'(\d+)\s*(?:tl|lira|₺)', text_lower)
    estimated_price = int(price_match.group(1)) if price_match else base_price
    if estimated_price <= 0:
        estimated_price = base_price
    
    service_type = "DIRECT_BOOKING" if any(
        x in text_lower for x in ["acil", "bugün", "hemen", "şimdi"]) else "MARKETPLACE_BIDDING"
    
    # cleaning_type
    cleaning_types = {
        "derin": "Derin Temizlik",
        "cam": "Cam Temizliği",
        "halı": "Halı Yıkama",
        "hali": "Halı Yıkama",
        "inşaat": "İnşaat Sonrası Temizlik",
        "insaat": "İnşaat Sonrası Temizlik",
        "ofis": "Ofis Temizliği",
        "büro": "Ofis Temizliği"
    }
    cleaning_type = "Genel Temizlik"
    for k, v in cleaning_types.items():
        if k in text_lower:
            cleaning_type = v
            break
            
    # preferred_date
    preferred_date = ""
    if "yarın" in text_lower or "yarin" in text_lower:
        preferred_date = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "bugün" in text_lower or "bugun" in text_lower:
        preferred_date = datetime.utcnow().strftime("%Y-%m-%d")
    
    has_pets = any(x in text_lower for x in ["kedi", "köpek", "hayvan", "evcil", "pet"])
    has_allergies = any(x in text_lower for x in ["alerji", "astım", "toz hassasiyeti"])
    special_notes = ""
    
    fallback_result = {
        "location": location,
        "house_size": house_size,
        "estimated_price": estimated_price,
        "description": text,
        "service_type": service_type,
        "cleaning_type": cleaning_type,
        "preferred_date": preferred_date,
        "has_pets": has_pets,
        "has_allergies": has_allergies,
        "special_notes": special_notes
    }
    
    return json.dumps(fallback_result, ensure_ascii=False)
