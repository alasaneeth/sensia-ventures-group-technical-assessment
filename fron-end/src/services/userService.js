// src/services/userService.js
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const userService = {
  getAll: async () => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  updateStatus: async (id, is_active) => {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`${API_URL}/users/${id}/status`, { is_active }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data.data
  },

  updateRoles: async (id, roles) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/users/${id}/roles`, { roles }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  updatePermissions: async (id, permissions) => {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_URL}/users/${id}/permissions`, { permissions }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },
}

export default userService