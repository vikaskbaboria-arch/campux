import api from './api';

/**
 * Fetch marketplace listings for the user's affiliated college
 * GET /api/v1/listing?page=1&limit=12&query=&category=&condition=&sortBy=createdAt&sortType=desc
 */
export const fetchListings = async (params = {}) => {
  const cleanParams = {};
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;
  if (params.query?.trim()) cleanParams.query = params.query.trim();
  if (params.category && params.category !== 'All') cleanParams.category = params.category;
  if (params.condition && params.condition !== 'All') cleanParams.condition = params.condition;
  if (params.sortBy) cleanParams.sortBy = params.sortBy;
  if (params.sortType) cleanParams.sortType = params.sortType;

  const response = await api.get('/listing', { params: cleanParams });
  return response.data?.data || { listing: [], pagination: {} };
};

/** Fetch listings belonging to one college campus. */
export const fetchListingsByCollege = async (collegeId) => {
  if (!collegeId) return [];
  const response = await api.get(`/colleges/${collegeId}/listings`);
  return response.data?.data || [];
};

/**
 * Create a new campus listing with multipart form data & images
 * POST /api/v1/listing/addListing
 */
export const createListing = async (formData) => {
  const response = await api.post('/listing/addListing', formData);
  return response.data;
};

/** Fetch one listing for its shareable detail page. */
export const getListingById = async (listingId) => {
  const response = await api.get(`/listing/${listingId}`);
  return response.data?.data;
};

/** Fetch all listings created by the signed-in student. */
export const fetchMyListings = async () => {
  const response = await api.get('/listing/getMylistings');
  return response.data?.data || [];
};

/** Fetch public listings for a seller profile. */
export const fetchListingsBySeller = async (userId) => {
  const response = await api.get(`/listing/seller/${userId}`);
  return response.data?.data || [];
};

/** Delete one of the signed-in student's listings. */
export const deleteListing = async (listingId) => {
  const response = await api.delete(`/listing/${listingId}`);
  return response.data?.data;
};

/** Mark one of the signed-in student's listings as sold. */
export const markListingAsSold = async (listingId) => {
  const response = await api.patch(`/listing/markAsSold/${listingId}`);
  return response.data?.data;
};

/** Update a listing owned by the signed-in student. */
export const updateListing = async (formData) => {
  const response = await api.patch('/listing/updateItem', formData);
  return response.data;
};
