// src/services/commentService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const commentService = {
  getAll: async (params = {}) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/comments`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  create: async (commentData) => {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_URL}/comments`, commentData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  update: async (id, content) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/comments/${id}`, { content }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  delete: async (id) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_URL}/comments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },
}

export default commentService