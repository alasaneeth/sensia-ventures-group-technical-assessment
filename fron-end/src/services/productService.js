// src/services/productService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const productService = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/products`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  getById: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  create: async (productData) => {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_URL}/products`, productData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  update: async (id, productData) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/products/${id}`, productData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },
  delete: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_URL}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },
}

export default productService