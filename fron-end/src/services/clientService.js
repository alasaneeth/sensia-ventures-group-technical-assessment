// src/services/clientService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const clientService = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/clients`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  getById: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/clients/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  create: async (clientData) => {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_URL}/clients`, clientData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  update: async (id, clientData) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/clients/${id}`, clientData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  delete: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_URL}/clients/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },
}

export default clientService