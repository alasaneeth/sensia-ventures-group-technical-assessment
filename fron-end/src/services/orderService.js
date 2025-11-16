// src/services/orderService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const orderService = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/orders`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  getById: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  create: async (orderData) => {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  update: async (id, orderData) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/orders/${id}`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  updateStatus: async (id, status) => {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`${API_URL}/orders/${id}/status`, { status }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  delete: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_URL}/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },
}

export default orderService