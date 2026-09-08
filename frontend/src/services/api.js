const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function planTrip(tripData) {
  try {
    const response = await fetch(`${API_BASE_URL}/plan-trip/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Trip planning API call failed:', error);
    throw error;
  }
}
