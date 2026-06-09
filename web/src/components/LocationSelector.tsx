import React, { useState, useEffect } from 'react';

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
}

interface LocationSelectorProps {
  value: string; // "City, District" format
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function LocationSelector({ value, onChange, className, placeholder }: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 1. Fetch all provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://turkiyeapi.dev/api/v1/provinces');
        if (!response.ok) throw new Error('API error');
        const json = await response.json();
        
        if (json.status === 'OK' && Array.isArray(json.data)) {
          const sorted = json.data.map((p: any) => ({
            id: p.id,
            name: p.name
          })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
          
          setProvinces(sorted);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        console.error('Error fetching provinces:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // 2. Parse initial value once provinces are loaded
  useEffect(() => {
    if (provinces.length > 0 && !initialized) {
      if (value) {
        const parts = value.split(',').map(p => p.trim());
        const city = parts[0] || '';
        const district = parts[1] || '';
        
        const match = provinces.find(p => p.name.toLowerCase() === city.toLowerCase());
        if (match) {
          setSelectedCity(match.name);
          setSelectedDistrict(district);
        } else {
          // If it doesn't match or has no city, we still initialize it in text box mode if error triggers later
          setSelectedCity('');
          setSelectedDistrict('');
        }
      }
      setInitialized(true);
    }
  }, [provinces, value, initialized]);

  // 3. Fetch districts when selectedCity changes
  useEffect(() => {
    if (!selectedCity || provinces.length === 0) {
      setDistricts([]);
      return;
    }

    const province = provinces.find(p => p.name === selectedCity);
    if (!province) return;

    const fetchDistricts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://turkiyeapi.dev/api/v1/provinces/${province.id}`);
        if (!response.ok) throw new Error('API error');
        const json = await response.json();
        
        if (json.status === 'OK' && json.data && Array.isArray(json.data.districts)) {
          const sorted = json.data.districts.map((d: any) => ({
            id: d.id,
            name: d.name
          })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
          
          setDistricts(sorted);
        } else {
          throw new Error('Invalid districts format');
        }
      } catch (err) {
        console.error('Error fetching districts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [selectedCity, provinces]);

  // 4. Update parent component value
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedDistrict('');
    onChange(city);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    if (selectedCity && dist) {
      onChange(`${selectedCity}, ${dist}`);
    } else {
      onChange(selectedCity);
    }
  };

  // If there's an error, fallback to text input
  if (error) {
    return (
      <input
        type="text"
        required
        placeholder={placeholder || "Örn: İstanbul, Beşiktaş"}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (loading && provinces.length === 0) {
    return (
      <div className="text-sm font-semibold text-gray-400 py-3.5 px-5 bg-gray-50 border border-gray-200 rounded-2xl animate-pulse">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* City Dropdown */}
      <div>
        <select
          required
          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
          value={selectedCity}
          onChange={handleCityChange}
        >
          <option value="">Şehir Seçin</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Dropdown */}
      <div>
        <select
          required
          disabled={!selectedCity || (loading && districts.length === 0)}
          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          value={selectedDistrict}
          onChange={handleDistrictChange}
        >
          <option value="">İlçe Seçin</option>
          {districts.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
