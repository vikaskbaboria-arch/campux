import api from './api';

/**
 * Fetch colleges directly from backend route:
 * GET /api/v1/colleges?query=<search>&limit=30
 */
export const searchColleges = async (query = '') => {
  const params = {
    limit: 30,
  };
  if (query?.trim()) {
    params.query = query.trim();
  }

  const response = await api.get('/colleges', { params });
  return response.data?.data?.colleges || [];
};

/**
 * Fetch a specific college by ID from backend route:
 * GET /api/v1/colleges/:collegeId
 */
export const getCollegeById = async (collegeId) => {
  if (!collegeId) return null;
  const response = await api.get(`/colleges/${collegeId}`);
  return response.data?.data || null;
};
