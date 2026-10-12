import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function buildProfileBasedSuggestions(profile: Record<string, any>, predictedEmission: number) {
  const treesToPlantMonthly = Math.max(2, Math.ceil(predictedEmission / 120));
  const suggestions: {
    title: string;
    category: string;
    priority: string;
    estimatedSavingKg: number;
    advice: string;
  }[] = [];

  // 1. Electric vehicles / transport
  if (profile.transport === 'private' && profile.vehicleType !== 'electric') {
    suggestions.push({
      title: 'Adapt to electric vehicles (EV) or public transport',
      category: 'Transport',
      priority: 'High Impact',
      estimatedSavingKg: Math.max(120, Math.round((Number(profile.vehicleMonthlyDistanceKm) || 500) * 0.18)),
      advice: `Switch from a ${profile.vehicleType} vehicle to an electric vehicle or use public transit for your ${profile.vehicleMonthlyDistanceKm} km monthly travel.`,
    });
  } else {
    suggestions.push({
      title: 'Use walking, cycling, or carpooling for short trips',
      category: 'Transport',
      priority: 'Quick Win',
      estimatedSavingKg: 65,
      advice: 'Choose active mobility like cycling or walking for daily errands to keep transport emissions minimal.',
    });
  }

  // 2. Solar energy / clean heating
  if (profile.heatingSource === 'coal' || profile.heatingSource === 'wood' || profile.heatingSource === 'natural gas') {
    suggestions.push({
      title: 'Use solar energy and clean electric heating',
      category: 'Home Energy',
      priority: 'High Impact',
      estimatedSavingKg: profile.heatingSource === 'coal' ? 270 : 140,
      advice: `Replace ${profile.heatingSource} heating with rooftop solar energy or a clean electric heat pump.`,
    });
  } else {
    suggestions.push({
      title: 'Use solar energy for household power needs',
      category: 'Home Energy',
      priority: 'High Impact',
      estimatedSavingKg: 135,
      advice: 'Install rooftop solar panels or subscribe to a community solar grid to power your home with clean energy.',
    });
  }

  // 3. LED bulbs & energy efficiency
  if (profile.energyEfficiency !== 'Yes') {
    suggestions.push({
      title: 'Use LED bulbs and energy-efficient appliances',
      category: 'Electricity',
      priority: 'Quick Win',
      estimatedSavingKg: 95,
      advice: 'Replace traditional lighting with LED bulbs and use 5-star energy-efficient home appliances to lower daily power consumption.',
    });
  } else {
    suggestions.push({
      title: 'Use smart power strips and LED lighting sensors',
      category: 'Electricity',
      priority: 'Quick Win',
      estimatedSavingKg: 55,
      advice: 'Turn off lights automatically and eliminate phantom standby power draw from chargers and appliances.',
    });
  }

  // 4. Biodegradable waste composting
  suggestions.push({
    title: 'Separate biodegradable waste to decompose at home',
    category: 'Waste Management',
    priority: 'High Impact',
    estimatedSavingKg: Math.max(60, (Number(profile.wasteBagWeeklyCount) || 3) * 22),
    advice: 'Segregate kitchen scraps and organic biodegradable waste into a home compost bin instead of sending them to landfills.',
  });

  // 5. Recycling streams
  const recycledCount = Array.isArray(profile.recycling) ? profile.recycling.length : 0;
  if (recycledCount < 4) {
    suggestions.push({
      title: 'Recycle paper, plastic, glass, and metal separately',
      category: 'Recycling',
      priority: 'Medium Impact',
      estimatedSavingKg: (4 - recycledCount) * 48,
      advice: `You currently recycle ${recycledCount} of 4 material types. Separating all dry recyclable waste saves raw material energy.`,
    });
  }

  // 6. Air travel reduction
  if (profile.airTravelFrequency === 'frequently' || profile.airTravelFrequency === 'very frequently') {
    suggestions.push({
      title: 'Reduce air travel and prefer trains for domestic trips',
      category: 'Aviation',
      priority: 'High Impact',
      estimatedSavingKg: profile.airTravelFrequency === 'very frequently' ? 680 : 390,
      advice: 'Combine trips or take rail transport instead of short-haul flights to drastically cut aviation carbon emissions.',
    });
  }

  // 7. Diet & food habits
  if (profile.diet === 'omnivore' || profile.diet === 'pescatarian') {
    suggestions.push({
      title: 'Include more plant-based and local seasonal meals',
      category: 'Diet & Food',
      priority: 'Medium Impact',
      estimatedSavingKg: 110,
      advice: 'Replacing meat meals with vegetarian or vegan options a few days a week significantly lowers food-related emissions.',
    });
  } else {
    suggestions.push({
      title: 'Buy local, seasonal groceries with minimal packaging',
      category: 'Diet & Food',
      priority: 'Quick Win',
      estimatedSavingKg: 50,
      advice: 'Choose locally grown produce and reusable shopping bags to reduce cold-storage and food transport emissions.',
    });
  }

  // 8. Screen & appliance usage
  if ((Number(profile.tvPcDailyHours) || 0) + (Number(profile.internetDailyHours) || 0) > 8) {
    suggestions.push({
      title: 'Unplug idle TV/PC devices and enable power-saving mode',
      category: 'Digital Habits',
      priority: 'Quick Win',
      estimatedSavingKg: 65,
      advice: `With ${Number(profile.tvPcDailyHours) + Number(profile.internetDailyHours)} combined daily screen and internet hours, enabling sleep timers and unplugging electronics saves electricity.`,
    });
  }

  // 9. Sustainable clothing
  if ((Number(profile.newClothesMonthly) || 0) > 6) {
    suggestions.push({
      title: 'Reduce monthly new clothes purchases and choose durable fabrics',
      category: 'Consumption',
      priority: 'Medium Impact',
      estimatedSavingKg: Math.round(((Number(profile.newClothesMonthly) || 10) - 3) * 11),
      advice: `Buying ${profile.newClothesMonthly} new clothes per month adds high textile manufacturing emissions; opt for durable or recycled apparel.`,
    });
  }

  // 10. Water conservation
  if (profile.showerFrequency === 'twice a day' || profile.showerFrequency === 'more frequently') {
    suggestions.push({
      title: 'Use low-flow showerheads and solar water heaters',
      category: 'Water & Heating',
      priority: 'Quick Win',
      estimatedSavingKg: 55,
      advice: 'Shorter daily showers and solar water heating reduce both water usage and thermal energy demand.',
    });
  }

  return {
    treesToPlantMonthly,
    summary: `Based on your predicted carbon footprint of ${predictedEmission.toLocaleString()} kg CO₂e/month, you should plant at least ${treesToPlantMonthly} trees per month and follow these simple daily habits to reduce your emissions.`,
    suggestions: suggestions.slice(0, 8),
  };
}

app.post('/api/ai-suggestions', async (req, res) => {
  const { profile, selectedModel, predictedEmission } = req.body || {};

  if (!profile || !predictedEmission) {
    res.status(400).json({ error: 'Missing profile or predictedEmission in request body.' });
    return;
  }

  const treesToPlantMonthly = Math.max(2, Math.ceil(Number(predictedEmission) / 120));

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json(buildProfileBasedSuggestions(profile, Number(predictedEmission)));
      return;
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const modelLabel =
      selectedModel === 'lstm'
        ? 'LSTM Deep Neural Network (R² = 0.9803)'
        : 'Random Forest Regressor (R² = 0.9237)';

    const prompt = `Analyze this user's monthly carbon footprint profile and provide 7 simple, practical, easy-to-understand suggestions to reduce their carbon emissions (such as: adapt to electric vehicles, use LED bulbs, use solar energy, separate biodegradable waste to decompose, recycle materials, reduce flights, save electricity, etc.) tailored to their profile performance.
Also state that based on their carbon emission of ${predictedEmission} kg CO2e/month, they need to plant at least ${treesToPlantMonthly} trees per month.

Selected ML Model: ${modelLabel}
Predicted Monthly Carbon Emission: ${predictedEmission} kg CO2e / month
Minimum Trees to Plant Monthly: ${treesToPlantMonthly} trees / month

User Lifestyle & Energy Profile:
- Transport Mode: ${profile.transport} (Vehicle Type: ${profile.vehicleType}, Monthly Distance: ${profile.vehicleMonthlyDistanceKm} km)
- Air Travel Frequency: ${profile.airTravelFrequency}
- Home Heating Energy Source: ${profile.heatingSource}
- Home Energy Efficiency: ${profile.energyEfficiency}
- Daily TV/PC Hours: ${profile.tvPcDailyHours} hrs, Daily Internet Hours: ${profile.internetDailyHours} hrs
- Cooking Appliances: ${Array.isArray(profile.cookingWith) ? profile.cookingWith.join(', ') : 'None'}
- Diet: ${profile.diet}, Monthly Grocery Bill: $${profile.monthlyGroceryBill}
- Monthly New Clothes: ${profile.newClothesMonthly} items, Shower Frequency: ${profile.showerFrequency}
- Waste Bag Size: ${profile.wasteBagSize} (${profile.wasteBagWeeklyCount} bags/week)
- Active Recycling Materials: ${Array.isArray(profile.recycling) && profile.recycling.length > 0 ? profile.recycling.join(', ') : 'None'}

Return a JSON object with treesToPlantMonthly, a simple summary, and 7 simple, actionable suggestions.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a friendly sustainability advisor. Give simple, clear, everyday suggestions like "Adapt to electric vehicles", "Use LED bulbs", "Use solar energy", and "Separate biodegradable waste to decompose" based on the user profile.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            treesToPlantMonthly: {
              type: Type.NUMBER,
              description: 'Minimum number of trees the user should plant per month based on their carbon emission.',
            },
            summary: {
              type: Type.STRING,
              description: 'A clear 1-2 sentence summary mentioning their emission and how many trees to plant per month.',
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Simple, clear suggestion title (e.g., Adapt to electric vehicles, Use LED bulbs, Use solar energy, Separate biodegradable waste to decompose).',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Category such as Transport, Home Energy, Electricity, Waste Management, Diet, or Lifestyle.',
                  },
                  priority: {
                    type: Type.STRING,
                    description: 'Impact level: High Impact, Medium Impact, or Quick Win.',
                  },
                  estimatedSavingKg: {
                    type: Type.NUMBER,
                    description: 'Estimated monthly CO2e reduction in kg.',
                  },
                  advice: {
                    type: Type.STRING,
                    description: 'Simple 1-sentence explanation of how to follow this tip.',
                  },
                },
                required: ['title', 'category', 'priority', 'estimatedSavingKg', 'advice'],
              },
            },
          },
          required: ['treesToPlantMonthly', 'summary', 'suggestions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.json(buildProfileBasedSuggestions(profile, Number(predictedEmission)));
      return;
    }

    const parsed = JSON.parse(text.trim());
    res.json({
      ...parsed,
      treesToPlantMonthly: parsed.treesToPlantMonthly || treesToPlantMonthly,
    });
  } catch (error: unknown) {
    console.error('Falling back to profile-based suggestions:', error);
    res.json(buildProfileBasedSuggestions(profile, Number(predictedEmission)));
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
