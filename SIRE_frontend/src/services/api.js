const API_BASE = 'http://localhost:8080/api';
const API_KEY = 'local-dev-key';

export const createSession = async (scenarioKey, instructorDisplayName) => {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-ticket-id': 'FRONTEND-' + Date.now()
    },
    body: JSON.stringify({ scenarioKey, instructorDisplayName })
  });
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
  return response.json();
};

export const getSessions = async () => {
  const response = await fetch(`${API_BASE}/session`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  if (!response.ok) {
    throw new Error('Failed to get sessions');
  }
  return response.json();
};

export const getSession = async (sessionCode) => {
  const response = await fetch(`${API_BASE}/session/${sessionCode}`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  if (!response.ok) {
    throw new Error('Failed to get session');
  }
  return response.json();
};

export const deleteSession = async (sessionCode) => {
  const response = await fetch(`${API_BASE}/session/${sessionCode}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY,
      'x-ticket-id': 'FRONTEND-' + Date.now()
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
  return response.json();
};

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE}/health`, {
    headers: {
      'x-api-key': API_KEY
    }
  });
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return response.json();
};
