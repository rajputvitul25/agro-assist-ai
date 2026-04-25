import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


def tr(language: str, en: str, hi: str) -> str:
    return hi if language == "hi" else en


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text or "")
    return normalized.strip().lower()


def contains_hindi(text: str) -> bool:
    return any("\u0900" <= char <= "\u097f" for char in text)


def format_date(date_str: str, language: str) -> str:
    try:
        parsed = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return date_str
    return parsed.strftime("%d %b %Y") if language == "en" else parsed.strftime("%d/%m/%Y")


def bullet_list(items: Iterable[str]) -> str:
    cleaned = [item.strip() for item in items if item and item.strip()]
    return "\n".join(f"- {item}" for item in cleaned)


@dataclass(frozen=True)
class ChatActionPayload:
    label_en: str
    label_hi: str
    route: Optional[str] = None
    message: Optional[str] = None
    url: Optional[str] = None

    def serialize(self, language: str) -> Dict[str, Optional[str]]:
        return {
            "label": self.label_hi if language == "hi" else self.label_en,
            "route": self.route,
            "message": self.message,
            "url": self.url,
        }


STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]

SEASONS = ["Kharif", "Rabi", "Summer"]

CROP_RECOMMENDATION_DB = [
    {
        "crop": "Rice",
        "phRange": (5.0, 7.5),
        "tempRange": (20, 35),
        "humidityRange": (60, 100),
        "rainfallRange": (800, 3000),
        "nitrogenPreference": (80, 200),
        "potassiumPreference": (100, 300),
        "phosphorusPreference": (20, 100),
        "seasons": ["Kharif"],
        "description_en": "Thrives in warm temperatures with high humidity and abundant water.",
        "description_hi": "यह फसल गर्म तापमान, अधिक नमी और पर्याप्त पानी में अच्छी रहती है।",
        "benefits_en": ["High yield potential", "Staple food crop", "Strong market demand"],
        "benefits_hi": ["उच्च उत्पादन क्षमता", "मुख्य खाद्य फसल", "बाजार में अच्छी मांग"],
    },
    {
        "crop": "Wheat",
        "phRange": (6.0, 7.5),
        "tempRange": (10, 25),
        "humidityRange": (40, 70),
        "rainfallRange": (300, 900),
        "nitrogenPreference": (80, 200),
        "potassiumPreference": (80, 200),
        "phosphorusPreference": (30, 90),
        "seasons": ["Rabi"],
        "description_en": "Performs well in cooler seasons with moderate moisture.",
        "description_hi": "यह फसल ठंडे मौसम और मध्यम नमी में अच्छा प्रदर्शन करती है।",
        "benefits_en": ["Good storage life", "Reliable yield", "High protein content"],
        "benefits_hi": ["अच्छी भंडारण क्षमता", "विश्वसनीय उत्पादन", "उच्च प्रोटीन"],
    },
    {
        "crop": "Maize",
        "phRange": (5.5, 7.5),
        "tempRange": (18, 30),
        "humidityRange": (50, 80),
        "rainfallRange": (500, 1200),
        "nitrogenPreference": (100, 250),
        "potassiumPreference": (80, 200),
        "phosphorusPreference": (30, 120),
        "seasons": ["Kharif", "Summer"],
        "description_en": "Versatile cereal crop suited to a variety of soils and climates.",
        "description_hi": "यह बहुउपयोगी अनाज फसल कई प्रकार की मिट्टी और मौसम में उगाई जा सकती है।",
        "benefits_en": ["High demand", "Fast growing", "Good animal feed"],
        "benefits_hi": ["अच्छी मांग", "तेजी से बढ़ती है", "पशु चारे के लिए उपयोगी"],
    },
    {
        "crop": "Cotton",
        "phRange": (5.5, 7.5),
        "tempRange": (20, 35),
        "humidityRange": (40, 70),
        "rainfallRange": (400, 1200),
        "nitrogenPreference": (60, 180),
        "potassiumPreference": (120, 300),
        "phosphorusPreference": (20, 80),
        "seasons": ["Kharif"],
        "description_en": "Fiber crop that prefers warm temperatures and well-drained soils.",
        "description_hi": "कपास गर्म तापमान और अच्छी जलनिकास वाली मिट्टी में बेहतर रहती है।",
        "benefits_en": ["High economic returns", "Industrial demand", "Cash crop"],
        "benefits_hi": ["उच्च आर्थिक लाभ", "औद्योगिक मांग", "नकदी फसल"],
    },
    {
        "crop": "Sugarcane",
        "phRange": (6.0, 8.0),
        "tempRange": (20, 35),
        "humidityRange": (60, 90),
        "rainfallRange": (1000, 2000),
        "nitrogenPreference": (120, 300),
        "potassiumPreference": (150, 350),
        "phosphorusPreference": (30, 100),
        "seasons": ["Kharif", "Rabi"],
        "description_en": "Perennial crop needing high moisture and nutrients.",
        "description_hi": "यह बहुवर्षीय फसल अधिक नमी और पोषक तत्वों की मांग करती है।",
        "benefits_en": ["High sugar yields", "Industrial crop", "Useful byproducts"],
        "benefits_hi": ["अधिक शर्करा उत्पादन", "औद्योगिक फसल", "उपयोगी उप-उत्पाद"],
    },
    {
        "crop": "Soybean",
        "phRange": (5.5, 7.0),
        "tempRange": (20, 30),
        "humidityRange": (50, 80),
        "rainfallRange": (500, 1000),
        "nitrogenPreference": (20, 80),
        "potassiumPreference": (40, 150),
        "phosphorusPreference": (20, 80),
        "seasons": ["Kharif"],
        "description_en": "Legume crop that improves soil nitrogen in moderate climates.",
        "description_hi": "सोयाबीन एक दलहनी फसल है जो मध्यम मौसम में मिट्टी की नाइट्रोजन स्थिति सुधारती है।",
        "benefits_en": ["Protein-rich", "Soil improving", "Good market demand"],
        "benefits_hi": ["प्रोटीन से भरपूर", "मिट्टी सुधारने में मददगार", "अच्छी बाजार मांग"],
    },
    {
        "crop": "Groundnut",
        "phRange": (5.5, 7.0),
        "tempRange": (20, 35),
        "humidityRange": (50, 80),
        "rainfallRange": (500, 1000),
        "nitrogenPreference": (20, 80),
        "potassiumPreference": (60, 180),
        "phosphorusPreference": (20, 80),
        "seasons": ["Kharif"],
        "description_en": "Oilseed crop suited to light soils and warm climates.",
        "description_hi": "यह तिलहनी फसल हल्की मिट्टी और गर्म मौसम के लिए उपयुक्त है।",
        "benefits_en": ["Oilseed market", "Nitrogen fixing", "Short duration"],
        "benefits_hi": ["तिलहन बाजार", "नाइट्रोजन स्थिरीकरण", "कम अवधि"],
    },
    {
        "crop": "Potato",
        "phRange": (5.0, 6.5),
        "tempRange": (10, 25),
        "humidityRange": (60, 90),
        "rainfallRange": (300, 900),
        "nitrogenPreference": (100, 250),
        "potassiumPreference": (120, 300),
        "phosphorusPreference": (40, 120),
        "seasons": ["Rabi", "Summer"],
        "description_en": "Tuber crop that prefers cooler temperatures and well-drained soils.",
        "description_hi": "आलू ठंडे तापमान और अच्छी जलनिकास वाली मिट्टी में बेहतर रहता है।",
        "benefits_en": ["High calorie yield", "Strong market", "Multiple varieties"],
        "benefits_hi": ["उच्च कैलोरी उत्पादन", "मजबूत बाजार", "अनेक किस्में"],
    },
    {
        "crop": "Tomato",
        "phRange": (5.5, 7.0),
        "tempRange": (18, 30),
        "humidityRange": (50, 80),
        "rainfallRange": (400, 1200),
        "nitrogenPreference": (80, 200),
        "potassiumPreference": (80, 200),
        "phosphorusPreference": (40, 120),
        "seasons": ["Summer"],
        "description_en": "High-value vegetable crop suitable for irrigated fields and protected cultivation.",
        "description_hi": "टमाटर उच्च मूल्य वाली सब्जी फसल है जो सिंचित खेतों और संरक्षित खेती में उपयुक्त है।",
        "benefits_en": ["High market value", "Short duration", "Good returns"],
        "benefits_hi": ["उच्च बाजार मूल्य", "कम अवधि", "अच्छा लाभ"],
    },
]

SOWING_CALENDAR = [
    {
        "crop": "Rice",
        "variety": "Basmati",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "120-150 days",
        "season": "Kharif",
        "region": "Punjab",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1000-1200 mm",
        "soilType": "Clay loam",
        "tips": [
            "Transplant 20-25 day old seedlings.",
            "Maintain 2-3 cm water level.",
            "Apply nitrogen in 3 splits.",
        ],
    },
    {
        "crop": "Wheat",
        "variety": "HD-2967",
        "sowingMonth": "November-December",
        "harvestMonth": "April-May",
        "duration": "120-140 days",
        "season": "Rabi",
        "region": "Punjab",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Sow after paddy harvest.",
            "Use seed rate near 100 kg/ha.",
            "Apply pre-sowing irrigation.",
        ],
    },
    {
        "crop": "Cotton",
        "variety": "Bt Cotton",
        "sowingMonth": "April-May",
        "harvestMonth": "October-December",
        "duration": "180-200 days",
        "season": "Kharif",
        "region": "Punjab",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "600-800 mm",
        "soilType": "Black cotton soil",
        "tips": [
            "Plant after soil temperature reaches 18 C.",
            "Maintain 45 cm row spacing.",
            "Monitor for pink bollworm regularly.",
        ],
    },
    {
        "crop": "Maize",
        "variety": "Hybrid",
        "sowingMonth": "February-March",
        "harvestMonth": "May-June",
        "duration": "90-110 days",
        "season": "Summer",
        "region": "Punjab",
        "temperatureRange": "20-30 C",
        "rainfallRequirement": "500-700 mm",
        "soilType": "Well-drained loam",
        "tips": [
            "Plant 2-3 seeds per hill.",
            "Apply balanced fertilizer.",
            "Ensure adequate irrigation.",
        ],
    },
    {
        "crop": "Sugarcane",
        "variety": "Co-238",
        "sowingMonth": "February-March",
        "harvestMonth": "December-February",
        "duration": "10-12 months",
        "season": "Summer",
        "region": "Uttar Pradesh",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1200-1500 mm",
        "soilType": "Deep fertile soil",
        "tips": [
            "Plant 3-bud setts.",
            "Maintain adequate moisture.",
            "Apply organic manure.",
        ],
    },
    {
        "crop": "Wheat",
        "variety": "PBW-343",
        "sowingMonth": "November-December",
        "harvestMonth": "April-May",
        "duration": "120-140 days",
        "season": "Rabi",
        "region": "Uttar Pradesh",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Timely sowing is crucial.",
            "Use certified seeds.",
            "Apply balanced fertilization.",
        ],
    },
    {
        "crop": "Rice",
        "variety": "Saryu-52",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "120-135 days",
        "season": "Kharif",
        "region": "Uttar Pradesh",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1000-1200 mm",
        "soilType": "Clay loam",
        "tips": [
            "Transplant healthy seedlings.",
            "Maintain water level.",
            "Regular weeding is needed.",
        ],
    },
    {
        "crop": "Fodder Maize",
        "variety": "African Tall",
        "sowingMonth": "March-April",
        "harvestMonth": "June-July",
        "duration": "70-90 days",
        "season": "Summer",
        "region": "Uttar Pradesh",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "400-500 mm",
        "soilType": "Well-drained loam",
        "tips": [
            "Quick-growing fodder crop.",
            "Good green biomass output.",
            "Regular irrigation improves yield.",
        ],
    },
    {
        "crop": "Rice",
        "variety": "Swarna",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "135-140 days",
        "season": "Kharif",
        "region": "Bihar",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1000-1200 mm",
        "soilType": "Clay",
        "tips": [
            "Flood resistant variety.",
            "Suitable for lowland areas.",
            "Matches Bihar conditions well.",
        ],
    },
    {
        "crop": "Wheat",
        "variety": "HD-2733",
        "sowingMonth": "November-December",
        "harvestMonth": "April-May",
        "duration": "120-125 days",
        "season": "Rabi",
        "region": "Bihar",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "400-500 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Heat tolerant variety.",
            "Good grain quality.",
            "Disease resistant option.",
        ],
    },
    {
        "crop": "Maize",
        "variety": "Prakash",
        "sowingMonth": "March-April",
        "harvestMonth": "June-July",
        "duration": "90-100 days",
        "season": "Summer",
        "region": "Bihar",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Well-drained",
        "tips": [
            "Good summer hybrid.",
            "Fits Bihar climate well.",
            "Regular irrigation is required.",
        ],
    },
    {
        "crop": "Cotton",
        "variety": "Bt Cotton",
        "sowingMonth": "June-July",
        "harvestMonth": "December-January",
        "duration": "180-200 days",
        "season": "Kharif",
        "region": "Maharashtra",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "600-800 mm",
        "soilType": "Black cotton soil",
        "tips": [
            "Major cash crop of Maharashtra.",
            "Bollworm resistant variety.",
            "Spacing near 90 cm x 60 cm.",
        ],
    },
    {
        "crop": "Sugarcane",
        "variety": "Co-86032",
        "sowingMonth": "February-March",
        "harvestMonth": "December-February",
        "duration": "10-12 months",
        "season": "Summer",
        "region": "Maharashtra",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1200-1500 mm",
        "soilType": "Deep black soil",
        "tips": [
            "High sugar content variety.",
            "Drought tolerant option.",
            "Ratoon crop is possible.",
        ],
    },
    {
        "crop": "Jowar",
        "variety": "CSH-16",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "110-120 days",
        "season": "Kharif",
        "region": "Maharashtra",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Black soil",
        "tips": [
            "Drought resistant crop.",
            "Good for rainfed areas.",
            "Nutritious grain option.",
        ],
    },
    {
        "crop": "Wheat",
        "variety": "NIAW-301",
        "sowingMonth": "November-December",
        "harvestMonth": "March-April",
        "duration": "110-120 days",
        "season": "Rabi",
        "region": "Maharashtra",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "300-400 mm",
        "soilType": "Black soil",
        "tips": [
            "Durum wheat variety.",
            "Good fit for Maharashtra.",
            "Heat tolerant line.",
        ],
    },
    {
        "crop": "Cotton",
        "variety": "Shankar-6",
        "sowingMonth": "June-July",
        "harvestMonth": "December-January",
        "duration": "180-200 days",
        "season": "Kharif",
        "region": "Gujarat",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "600-800 mm",
        "soilType": "Black cotton soil",
        "tips": [
            "High yielding variety.",
            "Good fiber quality.",
            "Pest management is crucial.",
        ],
    },
    {
        "crop": "Groundnut",
        "variety": "GG-20",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "110-120 days",
        "season": "Kharif",
        "region": "Gujarat",
        "temperatureRange": "25-30 C",
        "rainfallRequirement": "500-700 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Major oilseed crop.",
            "Calcium need is high.",
            "Harvest at proper pod maturity.",
        ],
    },
    {
        "crop": "Wheat",
        "variety": "GW-496",
        "sowingMonth": "November-December",
        "harvestMonth": "March-April",
        "duration": "110-115 days",
        "season": "Rabi",
        "region": "Gujarat",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "300-400 mm",
        "soilType": "Sandy loam",
        "tips": [
            "High yielding variety.",
            "Good grain quality.",
            "Suitable for Gujarat.",
        ],
    },
    {
        "crop": "Castor",
        "variety": "GCH-7",
        "sowingMonth": "March-April",
        "harvestMonth": "August-September",
        "duration": "150-180 days",
        "season": "Summer",
        "region": "Gujarat",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Well-drained",
        "tips": [
            "Commercial oil crop.",
            "Drought tolerant.",
            "Multiple harvests possible.",
        ],
    },
    {
        "crop": "Bajra",
        "variety": "HHB-67",
        "sowingMonth": "June-July",
        "harvestMonth": "September-October",
        "duration": "75-90 days",
        "season": "Kharif",
        "region": "Rajasthan",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "300-500 mm",
        "soilType": "Sandy soil",
        "tips": [
            "Drought resistant crop.",
            "Good for arid regions.",
            "Nutritious millet option.",
        ],
    },
    {
        "crop": "Mustard",
        "variety": "RH-30",
        "sowingMonth": "October-November",
        "harvestMonth": "February-March",
        "duration": "120-140 days",
        "season": "Rabi",
        "region": "Rajasthan",
        "temperatureRange": "10-25 C",
        "rainfallRequirement": "300-400 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Major oilseed of Rajasthan.",
            "Cold tolerant variety.",
            "Good oil content.",
        ],
    },
    {
        "crop": "Guar",
        "variety": "RGC-1038",
        "sowingMonth": "July-August",
        "harvestMonth": "October-November",
        "duration": "90-120 days",
        "season": "Kharif",
        "region": "Rajasthan",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "300-500 mm",
        "soilType": "Sandy soil",
        "tips": [
            "Industrial crop.",
            "Drought tolerant.",
            "Good market demand.",
        ],
    },
    {
        "crop": "Cumin",
        "variety": "GC-4",
        "sowingMonth": "November-December",
        "harvestMonth": "March-April",
        "duration": "110-130 days",
        "season": "Rabi",
        "region": "Rajasthan",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "200-300 mm",
        "soilType": "Sandy loam",
        "tips": [
            "High-value spice crop.",
            "Needs cool weather.",
            "Good option for dry regions.",
        ],
    },
    {
        "crop": "Rice",
        "variety": "ADT-43",
        "sowingMonth": "June-July",
        "harvestMonth": "September-October",
        "duration": "110-115 days",
        "season": "Kharif",
        "region": "Tamil Nadu",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "1000-1200 mm",
        "soilType": "Clay",
        "tips": [
            "Short duration variety.",
            "Good for Tamil Nadu.",
            "High yielding option.",
        ],
    },
    {
        "crop": "Sugarcane",
        "variety": "Co-86032",
        "sowingMonth": "January-February",
        "harvestMonth": "December-January",
        "duration": "10-12 months",
        "season": "Summer",
        "region": "Tamil Nadu",
        "temperatureRange": "20-35 C",
        "rainfallRequirement": "1200-1500 mm",
        "soilType": "Red soil",
        "tips": [
            "High sugar content.",
            "Suitable for Tamil Nadu.",
            "Good ratoon potential.",
        ],
    },
    {
        "crop": "Cotton",
        "variety": "MCU-5",
        "sowingMonth": "June-July",
        "harvestMonth": "December-January",
        "duration": "180-200 days",
        "season": "Kharif",
        "region": "Tamil Nadu",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "600-800 mm",
        "soilType": "Black soil",
        "tips": [
            "Medium staple cotton.",
            "Good for Tamil Nadu.",
            "Disease resistant variety.",
        ],
    },
    {
        "crop": "Ragi",
        "variety": "MR-1",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "120-135 days",
        "season": "Kharif",
        "region": "Karnataka",
        "temperatureRange": "20-30 C",
        "rainfallRequirement": "500-750 mm",
        "soilType": "Red soil",
        "tips": [
            "Nutritious millet crop.",
            "Drought tolerant.",
            "Good for rainfed areas.",
        ],
    },
    {
        "crop": "Sunflower",
        "variety": "KBSH-1",
        "sowingMonth": "February-March",
        "harvestMonth": "May-June",
        "duration": "90-110 days",
        "season": "Summer",
        "region": "Karnataka",
        "temperatureRange": "25-30 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Well-drained",
        "tips": [
            "Short duration oilseed crop.",
            "Good oil content.",
            "Needs clean field management.",
        ],
    },
    {
        "crop": "Jowar",
        "variety": "CSH-16",
        "sowingMonth": "June-July",
        "harvestMonth": "October-November",
        "duration": "110-120 days",
        "season": "Kharif",
        "region": "Karnataka",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "400-600 mm",
        "soilType": "Black soil",
        "tips": [
            "Drought resistant.",
            "Good fodder value.",
            "Suitable for dryland farming.",
        ],
    },
    {
        "crop": "Rice",
        "variety": "IET-4786",
        "sowingMonth": "June-July",
        "harvestMonth": "November-December",
        "duration": "135-140 days",
        "season": "Kharif",
        "region": "West Bengal",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "1200-1500 mm",
        "soilType": "Clay",
        "tips": [
            "High yielding variety.",
            "Flood tolerant.",
            "Good grain quality.",
        ],
    },
    {
        "crop": "Jute",
        "variety": "JRO-204",
        "sowingMonth": "March-April",
        "harvestMonth": "July-August",
        "duration": "120-150 days",
        "season": "Summer",
        "region": "West Bengal",
        "temperatureRange": "25-35 C",
        "rainfallRequirement": "1000-1200 mm",
        "soilType": "Clay loam",
        "tips": [
            "Fiber crop.",
            "Needs high humidity.",
            "Performs well with standing water.",
        ],
    },
    {
        "crop": "Potato",
        "variety": "Kufri Jyoti",
        "sowingMonth": "November-December",
        "harvestMonth": "February-March",
        "duration": "70-90 days",
        "season": "Rabi",
        "region": "West Bengal",
        "temperatureRange": "15-25 C",
        "rainfallRequirement": "300-400 mm",
        "soilType": "Sandy loam",
        "tips": [
            "Short duration variety.",
            "Good for West Bengal.",
            "High yielding option.",
        ],
    },
]

SUPPORTED_DISEASES = {
    "Sugarcane": ["Healthy", "Mosaic", "Red Rot", "Rust", "Yellow Leaf Disease"],
    "Wheat": ["Healthy", "Brown Rust", "Powdery Mildew", "Septoria", "Yellow Rust"],
    "Rice": ["Healthy", "Bacterial Leaf Blight", "Brown Spot", "Leaf Blast"],
}

DISEASE_GUIDANCE = {
    "Mosaic": {
        "crop": "Sugarcane",
        "summary_en": "Mosaic usually shows patchy light and dark green streaking on leaves.",
        "summary_hi": "मोज़ेक में पत्तियों पर हल्के और गहरे हरे धब्बेदार पैटर्न दिखाई देते हैं।",
        "actions_en": [
            "Remove heavily affected clumps.",
            "Use disease-free setts for the next planting.",
            "Control aphid-like sap-sucking vectors early.",
        ],
        "actions_hi": [
            "बहुत अधिक संक्रमित पौधों को हटाएं।",
            "अगली बुवाई में रोगमुक्त सेट्स का उपयोग करें।",
            "रस चूसने वाले कीटों का जल्दी नियंत्रण करें।",
        ],
    },
    "Red Rot": {
        "crop": "Sugarcane",
        "summary_en": "Red Rot is a serious sugarcane disease that can reduce cane quality and yield quickly.",
        "summary_hi": "रेड रॉट गन्ने की गंभीर बीमारी है जो गुणवत्ता और उत्पादन दोनों को घटा सकती है।",
        "actions_en": [
            "Rogue out infected canes and destroy residues.",
            "Avoid ratooning heavily affected fields.",
            "Improve drainage and use resistant varieties.",
        ],
        "actions_hi": [
            "संक्रमित गन्नों को हटाकर नष्ट करें।",
            "बहुत प्रभावित खेत में रatoon फसल न लें।",
            "जलनिकास सुधारें और प्रतिरोधी किस्में लें।",
        ],
    },
    "Rust": {
        "crop": "Sugarcane",
        "summary_en": "Rust often appears as orange to brown pustules and spreads faster in humid conditions.",
        "summary_hi": "रस्ट में आमतौर पर नारंगी या भूरे धब्बे दिखते हैं और नमी में तेजी से फैलता है।",
        "actions_en": [
            "Improve airflow and avoid excess nitrogen.",
            "Remove badly affected leaves where practical.",
            "Follow local fungicide guidance if disease pressure increases.",
        ],
        "actions_hi": [
            "हवा का प्रवाह बढ़ाएं और अधिक नाइट्रोजन से बचें।",
            "जहां संभव हो बहुत संक्रमित पत्तियां हटाएं।",
            "रोग बढ़ने पर स्थानीय सलाह के अनुसार फफूंदनाशी अपनाएं।",
        ],
    },
    "Yellow Leaf Disease": {
        "crop": "Sugarcane",
        "summary_en": "Yellow Leaf Disease causes yellowing along the midrib and may reduce sugar recovery.",
        "summary_hi": "येलो लीफ डिजीज में मध्य शिरा के साथ पीलापन आता है और शर्करा वसूली घट सकती है।",
        "actions_en": [
            "Use healthy planting material.",
            "Manage vectors and remove infected ratoons.",
            "Maintain balanced nutrition and field sanitation.",
        ],
        "actions_hi": [
            "स्वस्थ रोपण सामग्री का उपयोग करें।",
            "वाहक कीट नियंत्रित करें और संक्रमित रatoon हटाएं।",
            "संतुलित पोषण और खेत की स्वच्छता बनाए रखें।",
        ],
    },
    "Brown Rust": {
        "crop": "Wheat",
        "summary_en": "Brown Rust creates powdery brown pustules that can spread quickly on leaves.",
        "summary_hi": "ब्राउन रस्ट में पत्तियों पर भूरे पाउडरी धब्बे बनते हैं जो तेजी से फैल सकते हैं।",
        "actions_en": [
            "Scout fields regularly during cool humid weather.",
            "Prefer resistant varieties in the next season.",
            "Use fungicide only when disease severity justifies it locally.",
        ],
        "actions_hi": [
            "ठंडे और नम मौसम में खेत की नियमित निगरानी करें।",
            "अगले सीजन में प्रतिरोधी किस्में चुनें।",
            "स्थानीय सलाह के अनुसार ही फफूंदनाशी दें।",
        ],
    },
    "Powdery Mildew": {
        "crop": "Wheat",
        "summary_en": "Powdery Mildew looks like white powdery growth on leaf surfaces.",
        "summary_hi": "पाउडरी मिल्ड्यू में पत्तियों पर सफेद चूर्ण जैसा आवरण दिखता है।",
        "actions_en": [
            "Avoid dense crop canopy where possible.",
            "Balance nitrogen application.",
            "Monitor upper leaves near heading stage.",
        ],
        "actions_hi": [
            "बहुत घनी फसल से बचें।",
            "नाइट्रोजन का संतुलित उपयोग करें।",
            "बाल निकलने के समय ऊपरी पत्तियों की निगरानी करें।",
        ],
    },
    "Septoria": {
        "crop": "Wheat",
        "summary_en": "Septoria causes irregular brown lesions and can reduce green leaf area.",
        "summary_hi": "सेप्टोरिया में अनियमित भूरे धब्बे बनते हैं और हरी पत्ती क्षेत्र घट सकता है।",
        "actions_en": [
            "Use clean seed and rotate crops.",
            "Avoid prolonged leaf wetness where possible.",
            "Remove volunteer plants after harvest.",
        ],
        "actions_hi": [
            "स्वच्छ बीज और फसल चक्र अपनाएं।",
            "लंबे समय तक पत्तियों पर नमी न रहने दें।",
            "कटाई के बाद स्वयं उगी फसल हटाएं।",
        ],
    },
    "Yellow Rust": {
        "crop": "Wheat",
        "summary_en": "Yellow Rust often forms yellow linear pustules and spreads under cool conditions.",
        "summary_hi": "येलो रस्ट में पीली रेखीय धारियां बनती हैं और ठंडे मौसम में तेजी से फैलता है।",
        "actions_en": [
            "Inspect fields early in the season.",
            "Act quickly on first hotspots.",
            "Choose rust-tolerant varieties for future sowing.",
        ],
        "actions_hi": [
            "सीजन की शुरुआत में खेत देखें।",
            "पहले संक्रमित हिस्सों पर तुरंत कार्रवाई करें।",
            "अगली बुवाई में रस्ट सहनशील किस्में लें।",
        ],
    },
    "Bacterial Leaf Blight": {
        "crop": "Rice",
        "summary_en": "Bacterial Leaf Blight causes drying from the leaf tip and can spread after storms or high humidity.",
        "summary_hi": "बैक्टीरियल लीफ ब्लाइट में पत्तियों का सिरे से सूखना दिखता है और आंधी या अधिक नमी के बाद बढ़ सकता है।",
        "actions_en": [
            "Avoid excessive nitrogen and standing stress water.",
            "Use clean seed and resistant varieties where available.",
            "Keep field drainage functional.",
        ],
        "actions_hi": [
            "अधिक नाइट्रोजन और तनाव वाली खड़ी पानी की स्थिति से बचें।",
            "स्वच्छ बीज और उपलब्ध प्रतिरोधी किस्में अपनाएं।",
            "खेत का जलनिकास ठीक रखें।",
        ],
    },
    "Brown Spot": {
        "crop": "Rice",
        "summary_en": "Brown Spot creates circular to oval brown lesions and worsens under nutrient stress.",
        "summary_hi": "ब्राउन स्पॉट में गोल या अंडाकार भूरे धब्बे बनते हैं और पोषण कमी में बढ़ सकता है।",
        "actions_en": [
            "Correct nutrient imbalance, especially potassium where needed.",
            "Use healthy seed and good field sanitation.",
            "Avoid drought stress during sensitive stages.",
        ],
        "actions_hi": [
            "जरूरत हो तो पोषण असंतुलन, खासकर पोटाश, सुधारें।",
            "स्वस्थ बीज और खेत की सफाई रखें।",
            "संवेदनशील अवस्थाओं में सूखे के तनाव से बचाएं।",
        ],
    },
    "Leaf Blast": {
        "crop": "Rice",
        "summary_en": "Leaf Blast causes spindle-shaped lesions and may spread rapidly in humid weather.",
        "summary_hi": "लीफ ब्लास्ट में धुरी आकार के धब्बे बनते हैं और नम मौसम में तेजी से फैल सकता है।",
        "actions_en": [
            "Avoid excess nitrogen in susceptible fields.",
            "Maintain spacing and good airflow.",
            "Use resistant varieties and local fungicide guidance when needed.",
        ],
        "actions_hi": [
            "संवेदनशील खेतों में अधिक नाइट्रोजन से बचें।",
            "उचित दूरी और हवा का प्रवाह बनाए रखें।",
            "जरूरत पर प्रतिरोधी किस्में और स्थानीय फफूंदनाशी सलाह लें।",
        ],
    },
}


class FarmChatbotEngine:
    def __init__(self) -> None:
        backend_dir = Path(__file__).resolve().parent
        self.gov_updates_path = backend_dir.parent / "public" / "gov-updates.json"

    def respond(
        self,
        message: str,
        language: str = "en",
        history: Optional[Sequence[Dict[str, Optional[str]]]] = None,
    ) -> Dict[str, object]:
        raw_message = (message or "").strip()
        history = history or []
        if not raw_message:
            return self._welcome_response(language)

        normalized = normalize_text(raw_message)
        resolved_language = "hi" if language == "hi" or contains_hindi(raw_message) else "en"
        topic = self._detect_topic(raw_message, normalized, history)

        if topic == "crop_recommendation":
            response = self._handle_crop_recommendation(raw_message, normalized, resolved_language)
        elif topic == "sowing_calendar":
            response = self._handle_sowing_calendar(raw_message, normalized, resolved_language)
        elif topic == "government_updates":
            response = self._handle_government_updates(raw_message, normalized, resolved_language)
        elif topic == "crop_monitoring":
            response = self._handle_crop_monitoring(raw_message, normalized, resolved_language)
        else:
            response = self._handle_general_help(resolved_language)

        response["language"] = resolved_language
        response["topic"] = response.get("topic") or topic
        return response

    def _welcome_response(self, language: str) -> Dict[str, object]:
        reply = tr(
            language,
            "Hello! I'm FarmAssist AI. I can help with crop recommendations, leaf disease scanning, sowing calendars, and government updates. You can type or use the mic, and you can listen to my replies with the speaker button.",
            "नमस्ते! मैं FarmAssist AI हूँ। मैं फसल सुझाव, पत्ती रोग स्कैनिंग, बुवाई कैलेंडर और सरकारी अपडेट में मदद कर सकता हूँ। आप टाइप कर सकते हैं या माइक का उपयोग कर सकते हैं, और स्पीकर बटन से मेरे जवाब सुन भी सकते हैं।",
        )
        return {
            "reply": reply,
            "topic": "help",
            "suggestions": self._starter_suggestions(language),
            "actions": self._core_actions(language),
        }

    def _starter_suggestions(self, language: str) -> List[str]:
        return (
            [
                "Recommend a crop for my soil",
                "How do I scan a leaf image?",
                "Show sowing advice for Punjab",
                "Latest government schemes",
            ]
            if language == "en"
            else [
                "मेरी मिट्टी के लिए फसल सुझाओ",
                "पत्ती की फोटो कैसे स्कैन करूँ?",
                "Punjab के लिए बुवाई सलाह दिखाओ",
                "नवीनतम सरकारी योजनाएँ दिखाओ",
            ]
        )

    def _core_actions(self, language: str) -> List[Dict[str, Optional[str]]]:
        actions = [
            ChatActionPayload("Open Crop Recommendation", "Crop Recommendation खोलें", route="/crop-recommendation"),
            ChatActionPayload("Open Crop Monitoring", "Crop Monitoring खोलें", route="/crop-monitoring"),
            ChatActionPayload("Open Sowing Calendar", "Sowing Calendar खोलें", route="/sowing-calendar"),
            ChatActionPayload("Open Government Updates", "Government Updates खोलें", route="/government-updates"),
        ]
        return [action.serialize(language) for action in actions]

    def _detect_topic(
        self,
        raw_message: str,
        normalized: str,
        history: Sequence[Dict[str, Optional[str]]],
    ) -> str:
        scores = {
            "crop_recommendation": 0,
            "crop_monitoring": 0,
            "sowing_calendar": 0,
            "government_updates": 0,
            "help": 0,
        }

        recommendation_keywords = [
            "recommend",
            "best crop",
            "crop recommendation",
            "soil",
            "ph",
            "nitrogen",
            "phosphorus",
            "potassium",
            "npk",
            "rainfall",
            "temperature",
            "humidity",
            "मिट्टी",
            "पीएच",
            "नाइट्रोजन",
            "फास्फोरस",
            "पोटाश",
            "वर्षा",
            "आर्द्रता",
            "तापमान",
            "फसल सुझ",
        ]
        monitoring_keywords = [
            "monitor",
            "scan",
            "leaf",
            "disease",
            "blight",
            "rust",
            "mildew",
            "mosaic",
            "red rot",
            "healthy",
            "analyze image",
            "photo",
            "रोग",
            "पत्ती",
            "स्कैन",
            "फोटो",
            "मॉनिटर",
        ]
        sowing_keywords = [
            "sowing",
            "calendar",
            "harvest",
            "season",
            "kharif",
            "rabi",
            "summer",
            "variety",
            "month",
            "बुवाई",
            "कैलेंडर",
            "कटाई",
            "खरीफ",
            "रबी",
            "गर्मी",
            "मौसम",
        ]
        government_keywords = [
            "government",
            "scheme",
            "subsidy",
            "policy",
            "msp",
            "pm kisan",
            "pm-kisan",
            "update",
            "yojana",
            "gov",
            "सरकार",
            "योजना",
            "सब्सिडी",
            "नीति",
            "अपडेट",
            "pm किसान",
        ]
        help_keywords = [
            "help",
            "what can you do",
            "features",
            "capabilities",
            "hello",
            "hi",
            "hey",
            "namaste",
            "नमस्ते",
            "मदद",
            "क्या कर सकते",
        ]

        for keyword in recommendation_keywords:
            if keyword in normalized:
                scores["crop_recommendation"] += 2
        for keyword in monitoring_keywords:
            if keyword in normalized:
                scores["crop_monitoring"] += 2
        for keyword in sowing_keywords:
            if keyword in normalized:
                scores["sowing_calendar"] += 2
        for keyword in government_keywords:
            if keyword in normalized:
                scores["government_updates"] += 2
        for keyword in help_keywords:
            if keyword in normalized:
                scores["help"] += 2

        if self._extract_soil_parameters(raw_message):
            scores["crop_recommendation"] += 4

        crop = self._extract_crop(normalized)
        state = self._extract_state(normalized)
        season = self._extract_season(normalized)
        if crop and season:
            scores["sowing_calendar"] += 2
        if crop and "disease" in normalized:
            scores["crop_monitoring"] += 2
        if state and any(word in normalized for word in ("scheme", "update", "yojana", "सरकार", "योजना")):
            scores["government_updates"] += 2
        if state and season and "crop" in normalized:
            scores["sowing_calendar"] += 2

        topic = max(scores, key=scores.get)
        if scores[topic] > 0:
            return topic

        prior_topic = next(
            (
                item.get("topic")
                for item in reversed(history)
                if item.get("topic") in scores and item.get("topic") != "help"
            ),
            None,
        )
        if prior_topic and (state or season or crop or re.search(r"\d", raw_message)):
            return str(prior_topic)
        return "help"

    def _extract_state(self, normalized: str) -> Optional[str]:
        aliases = {"up": "Uttar Pradesh", "mp": "Madhya Pradesh"}
        tokens = set(re.findall(r"[a-zA-Z]+", normalized))
        for alias, full_name in aliases.items():
            if alias in tokens:
                return full_name
        for state in STATES:
            if state.lower() in normalized:
                return state
        return None

    def _extract_season(self, normalized: str) -> Optional[str]:
        for season in SEASONS:
            if season.lower() in normalized:
                return season
        return None

    def _extract_crop(self, normalized: str) -> Optional[str]:
        crop_aliases = {
            "rice": "Rice",
            "paddy": "Rice",
            "wheat": "Wheat",
            "maize": "Maize",
            "corn": "Maize",
            "cotton": "Cotton",
            "sugarcane": "Sugarcane",
            "soybean": "Soybean",
            "groundnut": "Groundnut",
            "potato": "Potato",
            "tomato": "Tomato",
            "bajra": "Bajra",
            "mustard": "Mustard",
            "jowar": "Jowar",
            "ragi": "Ragi",
            "jute": "Jute",
            "गन्ना": "Sugarcane",
            "गेहूं": "Wheat",
            "धान": "Rice",
            "चावल": "Rice",
            "मक्का": "Maize",
            "कपास": "Cotton",
            "सोयाबीन": "Soybean",
            "मूंगफली": "Groundnut",
            "आलू": "Potato",
            "टमाटर": "Tomato",
            "सरसों": "Mustard",
        }
        for alias, crop_name in crop_aliases.items():
            if alias in normalized:
                return crop_name
        return None

    def _extract_soil_parameters(self, message: str) -> Dict[str, float]:
        patterns = {
            "pH": [
                r"(?:soil\s*)?ph\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"पीएच\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "nitrogen": [
                r"nitrogen\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"\bn\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"नाइट्रोजन\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "phosphorus": [
                r"phosphorus\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"\bp\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"फास्फोरस\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "potassium": [
                r"potassium\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"\bk\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"पोटाश\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "temperature": [
                r"temperature\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"temp\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"तापमान\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "humidity": [
                r"humidity\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"आर्द्रता\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
            "rainfall": [
                r"rainfall\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"rain\s*[:=]?\s*(\d+(?:\.\d+)?)",
                r"वर्षा\s*[:=]?\s*(\d+(?:\.\d+)?)",
            ],
        }
        extracted: Dict[str, float] = {}
        for key, key_patterns in patterns.items():
            for pattern in key_patterns:
                match = re.search(pattern, message, re.IGNORECASE)
                if match:
                    extracted[key] = float(match.group(1))
                    break
        return extracted

    def _range_score(self, value: float, bounds: Tuple[float, float]) -> float:
        lower, upper = bounds
        if lower <= value <= upper:
            return 1.0
        span = max(1.0, upper - lower)
        distance = lower - value if value < lower else value - upper
        return max(0.0, 1 - distance / (span * 1.5))

    def _handle_crop_recommendation(
        self, raw_message: str, normalized: str, language: str
    ) -> Dict[str, object]:
        params = self._extract_soil_parameters(raw_message)
        state = self._extract_state(normalized)
        season = self._extract_season(normalized)

        if len(params) < 4:
            reply = tr(
                language,
                "I can calculate a grounded crop recommendation if you share at least pH, nitrogen, phosphorus, potassium, temperature, humidity, rainfall, plus state and season. Example: `pH 6.5, nitrogen 100, phosphorus 50, potassium 200, temperature 28, humidity 65, rainfall 1200, state Punjab, season Kharif`.",
                "मैं बेहतर फसल सुझाव देने के लिए कम से कम pH, nitrogen, phosphorus, potassium, temperature, humidity, rainfall, साथ में state और season चाहता हूँ। उदाहरण: `pH 6.5, nitrogen 100, phosphorus 50, potassium 200, temperature 28, humidity 65, rainfall 1200, state Punjab, season Kharif`.",
            )
            return {
                "reply": reply,
                "topic": "crop_recommendation",
                "suggestions": [
                    "pH 6.5 nitrogen 100 phosphorus 50 potassium 200 temperature 28 humidity 65 rainfall 1200 state Punjab season Kharif"
                ]
                if language == "en"
                else [
                    "pH 6.5 nitrogen 100 phosphorus 50 potassium 200 temperature 28 humidity 65 rainfall 1200 state Punjab season Kharif"
                ],
                "actions": [
                    ChatActionPayload(
                        "Open Crop Recommendation",
                        "Crop Recommendation खोलें",
                        route="/crop-recommendation",
                    ).serialize(language)
                ],
            }

        weights = {
            "pH": 1.2,
            "temperature": 1.0,
            "humidity": 0.9,
            "rainfall": 0.9,
            "nitrogen": 0.6,
            "phosphorus": 0.5,
            "potassium": 0.6,
            "season": 1.0,
        }

        scored: List[Dict[str, object]] = []
        for crop in CROP_RECOMMENDATION_DB:
            score = 0.0
            max_weight = 0.0
            if "pH" in params:
                score += weights["pH"] * self._range_score(params["pH"], crop["phRange"])
                max_weight += weights["pH"]
            if "temperature" in params:
                score += weights["temperature"] * self._range_score(params["temperature"], crop["tempRange"])
                max_weight += weights["temperature"]
            if "humidity" in params:
                score += weights["humidity"] * self._range_score(params["humidity"], crop["humidityRange"])
                max_weight += weights["humidity"]
            if "rainfall" in params:
                score += weights["rainfall"] * self._range_score(params["rainfall"], crop["rainfallRange"])
                max_weight += weights["rainfall"]
            if "nitrogen" in params:
                score += weights["nitrogen"] * self._range_score(params["nitrogen"], crop["nitrogenPreference"])
                max_weight += weights["nitrogen"]
            if "phosphorus" in params:
                score += weights["phosphorus"] * self._range_score(params["phosphorus"], crop["phosphorusPreference"])
                max_weight += weights["phosphorus"]
            if "potassium" in params:
                score += weights["potassium"] * self._range_score(params["potassium"], crop["potassiumPreference"])
                max_weight += weights["potassium"]
            if season:
                score += weights["season"] * (1.0 if season in crop["seasons"] else 0.0)
                max_weight += weights["season"]
            normalized_score = max(0.0, min(1.0, score / max_weight if max_weight else 0.0))
            confidence = round(50 + normalized_score * 49)
            scored.append(
                {
                    "crop": crop["crop"],
                    "confidence": confidence,
                    "description_en": crop["description_en"],
                    "description_hi": crop["description_hi"],
                    "benefits_en": crop["benefits_en"],
                    "benefits_hi": crop["benefits_hi"],
                    "score": normalized_score,
                }
            )

        ranked = sorted(scored, key=lambda item: float(item["score"]), reverse=True)[:3]
        top = ranked[0]
        location_text = ""
        if state or season:
            location_text = tr(
                language,
                f" for {state or 'your area'} in {season or 'the selected season'}",
                f" {state or 'आपके क्षेत्र'} में {season or 'चुने गए मौसम'} के लिए",
            )

        lines = [
            tr(
                language,
                f"My top recommendation{location_text} is {top['crop']} with about {top['confidence']}% confidence.",
                f"मेरी सबसे अच्छी फसल सलाह{location_text} {top['crop']} है, लगभग {top['confidence']}% confidence के साथ।",
            ),
            tr(
                language,
                str(top["description_en"]),
                str(top["description_hi"]),
            ),
            tr(language, "Top options:", "शीर्ष विकल्प:"),
        ]
        for item in ranked:
            description = item["description_hi"] if language == "hi" else item["description_en"]
            lines.append(f"- {item['crop']} ({item['confidence']}%) - {description}")

        benefit_key = "benefits_hi" if language == "hi" else "benefits_en"
        lines.append(tr(language, "Why the top crop fits:", "यह फसल क्यों उपयुक्त है:"))
        lines.extend(f"- {benefit}" for benefit in top[benefit_key])  # type: ignore[index]
        lines.append(
            tr(
                language,
                "You can use the Crop Recommendation page to test the same values in the full form.",
                "आप यही मान Crop Recommendation पेज में भरकर पूरी तुलना देख सकते हैं।",
            )
        )

        suggestions = (
            [
                "Show sowing advice for the top crop",
                "Open Crop Recommendation",
                "Give fertilizer tips for this crop",
            ]
            if language == "en"
            else [
                "इस फसल की बुवाई सलाह दिखाओ",
                "Crop Recommendation खोलें",
                "इस फसल के लिए उर्वरक सुझाव दो",
            ]
        )

        return {
            "reply": "\n".join(lines),
            "topic": "crop_recommendation",
            "suggestions": suggestions,
            "actions": [
                ChatActionPayload(
                    "Open Crop Recommendation",
                    "Crop Recommendation खोलें",
                    route="/crop-recommendation",
                ).serialize(language),
                ChatActionPayload(
                    "Show sowing advice",
                    "बुवाई सलाह दिखाएँ",
                    message=f"{top['crop']} sowing calendar {state or ''} {season or ''}".strip(),
                ).serialize(language),
            ],
        }

    def _handle_sowing_calendar(
        self, raw_message: str, normalized: str, language: str
    ) -> Dict[str, object]:
        state = self._extract_state(normalized)
        season = self._extract_season(normalized)
        crop = self._extract_crop(normalized)

        filtered = list(SOWING_CALENDAR)
        if state:
            state_specific = [item for item in filtered if item["region"] == state]
            filtered = state_specific or filtered
        if season:
            season_specific = [item for item in filtered if item["season"] == season]
            filtered = season_specific or filtered
        if crop:
            crop_specific = [item for item in filtered if item["crop"].lower() == crop.lower()]
            filtered = crop_specific or filtered

        if not filtered:
            reply = tr(
                language,
                "I could not match that sowing request. Try a state like Punjab, Uttar Pradesh, Maharashtra, Gujarat, Rajasthan, Tamil Nadu, Karnataka, Bihar, or West Bengal and optionally add a season like Kharif or Rabi.",
                "मैं उस बुवाई अनुरोध से मेल नहीं बिठा पाया। Punjab, Uttar Pradesh, Maharashtra, Gujarat, Rajasthan, Tamil Nadu, Karnataka, Bihar या West Bengal जैसे राज्य और Kharif या Rabi जैसा season लिखकर पूछें।",
            )
            return {
                "reply": reply,
                "topic": "sowing_calendar",
                "suggestions": self._starter_suggestions(language),
                "actions": [
                    ChatActionPayload(
                        "Open Sowing Calendar",
                        "Sowing Calendar खोलें",
                        route="/sowing-calendar",
                    ).serialize(language)
                ],
            }

        if crop and len(filtered) == 1:
            item = filtered[0]
            lines = [
                tr(
                    language,
                    f"{item['crop']} guidance for {item['region']} ({item['season']}).",
                    f"{item['region']} के लिए {item['crop']} मार्गदर्शन ({item['season']}).",
                ),
                tr(
                    language,
                    f"Variety: {item['variety']} | Sowing: {item['sowingMonth']} | Harvest: {item['harvestMonth']} | Duration: {item['duration']}",
                    f"किस्म: {item['variety']} | बुवाई: {item['sowingMonth']} | कटाई: {item['harvestMonth']} | अवधि: {item['duration']}",
                ),
                tr(
                    language,
                    f"Temperature: {item['temperatureRange']} | Rainfall: {item['rainfallRequirement']} | Soil: {item['soilType']}",
                    f"तापमान: {item['temperatureRange']} | वर्षा: {item['rainfallRequirement']} | मिट्टी: {item['soilType']}",
                ),
                tr(language, "Key tips:", "मुख्य सुझाव:"),
                bullet_list(item["tips"]),
            ]
        else:
            heading = tr(
                language,
                f"Sowing options for {state or 'the selected region'}{f' in {season}' if season else ''}:",
                f"{state or 'चुने गए क्षेत्र'}{f' में {season}' if season else ''} के लिए बुवाई विकल्प:",
            )
            lines = [heading]
            for item in filtered[:4]:
                lines.append(
                    f"- {item['crop']} ({item['variety']}) - {item['sowingMonth']} sowing, {item['harvestMonth']} harvest"
                )
            lines.append(
                tr(
                    language,
                    "Ask for a specific crop to get a more detailed guide.",
                    "किसी खास फसल का नाम लिखें, मैं अधिक विस्तृत मार्गदर्शन दूँगा।",
                )
            )

        suggestions = (
            [
                "Show rice sowing advice",
                "Show Kharif crops for Punjab",
                "Open Sowing Calendar",
            ]
            if language == "en"
            else [
                "Rice की बुवाई सलाह दिखाओ",
                "Punjab के Kharif crops दिखाओ",
                "Sowing Calendar खोलें",
            ]
        )
        return {
            "reply": "\n".join(lines),
            "topic": "sowing_calendar",
            "suggestions": suggestions,
            "actions": [
                ChatActionPayload(
                    "Open Sowing Calendar",
                    "Sowing Calendar खोलें",
                    route="/sowing-calendar",
                ).serialize(language)
            ],
        }

    def _load_government_updates(self) -> Dict[str, object]:
        try:
            return json.loads(self.gov_updates_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {"lastUpdated": None, "items": []}

    def _handle_government_updates(
        self, raw_message: str, normalized: str, language: str
    ) -> Dict[str, object]:
        payload = self._load_government_updates()
        items = list(payload.get("items", []))
        if not items:
            reply = tr(
                language,
                "The government updates feed is not available right now, but you can still open the Government Updates page inside the app.",
                "इस समय सरकारी अपडेट फ़ीड उपलब्ध नहीं है, लेकिन आप ऐप के Government Updates पेज पर जा सकते हैं।",
            )
            return {
                "reply": reply,
                "topic": "government_updates",
                "suggestions": self._starter_suggestions(language),
                "actions": [
                    ChatActionPayload(
                        "Open Government Updates",
                        "Government Updates खोलें",
                        route="/government-updates",
                    ).serialize(language)
                ],
            }

        state = self._extract_state(normalized)
        query_terms = [
            token
            for token in re.findall(r"[a-zA-Z]+", normalized)
            if token
            not in {
                "latest",
                "recent",
                "government",
                "scheme",
                "schemes",
                "subsidy",
                "policy",
                "policies",
                "update",
                "updates",
                "show",
                "for",
                "the",
                "in",
            }
        ]

        filtered = items
        if state:
            filtered = [item for item in filtered if item.get("state") in {state, "All States"}] or filtered

        if "msp" in normalized:
            filtered = [item for item in filtered if "msp" in (item.get("title", "") + item.get("description", "")).lower()] or filtered
        elif "pm kisan" in normalized or "pm-kisan" in normalized or "pm किसान" in normalized:
            filtered = [item for item in filtered if "pm" in item.get("source", "").lower() or "pm" in item.get("title", "").lower()] or filtered
        elif query_terms:
            keyword_filtered = [
                item
                for item in filtered
                if any(
                    term in (item.get("title", "") + " " + item.get("description", "") + " " + item.get("source", "")).lower()
                    for term in query_terms
                )
            ]
            filtered = keyword_filtered or filtered

        filtered.sort(key=lambda item: item.get("datePublished", ""), reverse=True)
        if state:
            filtered.sort(key=lambda item: 0 if item.get("state") == state else 1)
        top_items = filtered[:3]
        last_updated = payload.get("lastUpdated")

        intro = tr(
            language,
            "Here are the latest government updates available inside the app data feed:",
            "ऐप के डेटा फ़ीड में उपलब्ध नवीनतम सरकारी अपडेट ये हैं:",
        )
        if state:
            intro = tr(
                language,
                f"Here are the latest government updates relevant to {state}:",
                f"{state} से जुड़े नवीनतम सरकारी अपडेट ये हैं:",
            )

        lines = [intro]
        for item in top_items:
            title = item.get("title", "Update")
            item_state = item.get("state", "All States")
            published = format_date(str(item.get("datePublished", "")), language)
            source = item.get("source", "Government")
            lines.append(f"- {title} | {item_state} | {published} | {source}")

        if last_updated:
            lines.append(
                tr(
                    language,
                    f"Feed updated on {format_date(str(last_updated), language)}.",
                    f"फ़ीड अपडेट समय: {format_date(str(last_updated), language)}.",
                )
            )

        actions = [
            ChatActionPayload(
                "Open Government Updates",
                "Government Updates खोलें",
                route="/government-updates",
            ).serialize(language)
        ]
        top_link = top_items[0].get("link") if top_items else None
        if isinstance(top_link, str) and top_link:
            actions.append(
                ChatActionPayload(
                    "Open official link",
                    "आधिकारिक लिंक खोलें",
                    url=top_link,
                ).serialize(language)
            )

        suggestions = (
            [
                "Show PM-KISAN updates",
                "Show MSP updates",
                "Show schemes for Uttar Pradesh",
            ]
            if language == "en"
            else [
                "PM-KISAN अपडेट दिखाओ",
                "MSP अपडेट दिखाओ",
                "Uttar Pradesh की योजनाएँ दिखाओ",
            ]
        )

        return {
            "reply": "\n".join(lines),
            "topic": "government_updates",
            "suggestions": suggestions,
            "actions": actions,
        }

    def _handle_crop_monitoring(
        self, raw_message: str, normalized: str, language: str
    ) -> Dict[str, object]:
        crop = self._extract_crop(normalized)
        disease = next(
            (name for name in DISEASE_GUIDANCE if name.lower() in normalized),
            None,
        )

        if disease:
            info = DISEASE_GUIDANCE[disease]
            action_key = "actions_hi" if language == "hi" else "actions_en"
            summary_key = "summary_hi" if language == "hi" else "summary_en"
            lines = [
                tr(
                    language,
                    f"{info['crop']} - {disease}",
                    f"{info['crop']} - {disease}",
                ),
                str(info[summary_key]),
                tr(language, "Suggested next steps:", "अगले सुझाए गए कदम:"),
                bullet_list(info[action_key]),  # type: ignore[arg-type]
                tr(
                    language,
                    "You can upload a leaf photo in Crop Monitoring to compare against the trained classes.",
                    "आप Crop Monitoring में पत्ती की फोटो अपलोड करके प्रशिक्षित classes से तुलना कर सकते हैं।",
                ),
            ]
            return {
                "reply": "\n".join(lines),
                "topic": "crop_monitoring",
                "suggestions": (
                    ["Open Crop Monitoring", f"Show supported diseases for {info['crop']}"]
                    if language == "en"
                    else ["Crop Monitoring खोलें", f"{info['crop']} के supported diseases दिखाओ"]
                ),
                "actions": [
                    ChatActionPayload(
                        "Open Crop Monitoring",
                        "Crop Monitoring खोलें",
                        route="/crop-monitoring",
                    ).serialize(language)
                ],
            }

        if crop in SUPPORTED_DISEASES:
            disease_list = ", ".join(SUPPORTED_DISEASES[crop])
            reply = tr(
                language,
                f"{crop} is supported by the scanner. Detectable classes: {disease_list}. For best results, upload one clear leaf image with visible symptoms and minimal background clutter.",
                f"{crop} scanner में supported है। Detectable classes: {disease_list}. बेहतर परिणाम के लिए एक साफ पत्ती की फोटो अपलोड करें जिसमें लक्षण स्पष्ट दिखें और background कम हो।",
            )
            return {
                "reply": reply,
                "topic": "crop_monitoring",
                "suggestions": (
                    ["How do I take a better leaf photo?", "Open Crop Monitoring"]
                    if language == "en"
                    else ["अच्छी leaf photo कैसे लें?", "Crop Monitoring खोलें"]
                ),
                "actions": [
                    ChatActionPayload(
                        "Open Crop Monitoring",
                        "Crop Monitoring खोलें",
                        route="/crop-monitoring",
                    ).serialize(language)
                ],
            }

        lines = [
            tr(
                language,
                "The Crop Monitoring page can scan leaf images for Sugarcane, Wheat, and Rice.",
                "Crop Monitoring पेज Sugarcane, Wheat और Rice की leaf images स्कैन कर सकता है।",
            ),
            tr(language, "Supported disease classes:", "Supported disease classes:"),
        ]
        for crop_name, diseases in SUPPORTED_DISEASES.items():
            lines.append(f"- {crop_name}: {', '.join(diseases)}")
        lines.append(
            tr(
                language,
                "Best scan tips: choose one leaf, use natural light, avoid blur, and retake the photo if confidence is low.",
                "बेहतर स्कैन टिप्स: एक ही पत्ती चुनें, प्राकृतिक रोशनी रखें, blur से बचें, और confidence कम हो तो फोटो दोबारा लें।",
            )
        )

        return {
            "reply": "\n".join(lines),
            "topic": "crop_monitoring",
            "suggestions": (
                ["Show sugarcane diseases", "Open Crop Monitoring", "How do I improve scan accuracy?"]
                if language == "en"
                else ["Sugarcane diseases दिखाओ", "Crop Monitoring खोलें", "स्कैन accuracy कैसे बढ़ाऊँ?"]
            ),
            "actions": [
                ChatActionPayload(
                    "Open Crop Monitoring",
                    "Crop Monitoring खोलें",
                    route="/crop-monitoring",
                ).serialize(language)
            ],
        }

    def _handle_general_help(self, language: str) -> Dict[str, object]:
        reply = tr(
            language,
            "I can help you use the full project. Ask me for crop recommendations from soil values, sowing guidance by state and season, disease scan support for sugarcane/wheat/rice, or the latest government updates in the app. You can also speak with the mic and listen to replies.",
            "मैं पूरे प्रोजेक्ट में आपकी मदद कर सकता हूँ। आप मिट्टी के मानों से फसल सुझाव, राज्य और season के अनुसार बुवाई मार्गदर्शन, sugarcane/wheat/rice disease scan support, या ऐप के सरकारी अपडेट पूछ सकते हैं। आप माइक से बोल भी सकते हैं और जवाब सुन भी सकते हैं।",
        )
        return {
            "reply": reply,
            "topic": "help",
            "suggestions": self._starter_suggestions(language),
            "actions": self._core_actions(language),
        }
