import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export async function checkApiHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function predictSeverity(payload) {
  const response = await api.post('/predict', payload)
  return response.data
}

export async function fetchAccidents() {
  const response = await api.get('/accidents')
  return response.data
}

export async function fetchSeverityAnalytics() {
  const response = await api.get('/analytics/severity')
  return response.data
}

export async function fetchTrendAnalytics() {
  const response = await api.get('/analytics/trends')
  return response.data
}

export default api
