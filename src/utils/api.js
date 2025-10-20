import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.3:3000/api'; // Updated to correct local IP

// Food Logs API
export const createFoodLog = async (foodLog) => {
  try {
    if (!foodLog.user_id) {
      throw new Error('user_id is required for creating a food log');
    }
    const response = await axios.post(`${API_BASE_URL}/foodlogs`, {
      ...foodLog,
      created_at: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating food log:', error);
    throw error;
  }
};

export const getFoodLogs = async (userId) => {
  try {
    if (!userId) throw new Error('userId is required for fetching food logs');
    const response = await axios.get(`${API_BASE_URL}/foodlogs?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting food logs:', error);
    throw error;
  }
};

export const updateFoodLog = async (id, updates) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/foodlogs/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating food log:', error);
    throw error;
  }
};

export const deleteFoodLog = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/foodlogs/${id}`);
  } catch (error) {
    console.error('Error deleting food log:', error);
    throw error;
  }
};

// Food Analysis API
export const analyzeFood = async (text) => {
  try {
    const response = await axios.post('http://192.168.1.4:3000/analyze-food', { text });
    return response.data;
  } catch (error) {
    console.error('Error analyzing food:', error);
    throw error;
  }
};

// Profile API
export const upsertProfile = async (profileData) => {
  try {
    const response = await axios.post('http://192.168.1.9:3000/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }
}; 