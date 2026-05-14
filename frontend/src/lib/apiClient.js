const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = {
  async get(endpoint, auth = true) {
    return fetchAPI(endpoint, { method: 'GET' }, auth);
  },
  
  async post(endpoint, data, auth = true) {
    return fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, auth);
  },
  
  async put(endpoint, data, auth = true) {
    return fetchAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, auth);
  },
  
  async patch(endpoint, data, auth = true) {
    return fetchAPI(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }, auth);
  },
  
  async delete(endpoint, auth = true) {
    return fetchAPI(endpoint, { method: 'DELETE' }, auth);
  }
};

async function fetchAPI(endpoint, options = {}, auth = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Force logout on token expiry
    localStorage.removeItem('token');
    window.location.href = '/signin';
  }

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // Ignore if not json
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
