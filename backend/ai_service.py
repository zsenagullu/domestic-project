import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure Google Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-1.5-flash')

def analyze_voice_command(text: str) -> str:
    """
    Analyzes user's voice command text, extracts necessary job details
    using Google Gemini, and returns JSON string structure suitable for JobCreate schema.
    """
    prompt = f"""
    Sen bir asistan botusun. Kullanıcının temizlik hizmeti ilan teklifini (sesli komuttan yazıya çevrilmiş haliyle) analiz etmelisin.
    Aşağıdaki metni analiz edip şu JSON formatında bir çıktı ver: 
    {{ "title": "...", "description": "..." }}

    Metin: "{text}"
    Sadece geçerli bir JSON çıktısı ver. Başka bir metin ekleme.
    """
    
    response = model.generate_content(prompt)
    
    # Returning raw string for simplicity, further validation could parse it as JSON
    return response.text.strip('```json').strip('```').strip()
