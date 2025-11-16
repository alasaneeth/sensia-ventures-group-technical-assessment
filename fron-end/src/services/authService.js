// src/services/authService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password })
    return response.data.data
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData)
    return response.data
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },
}

export default authService