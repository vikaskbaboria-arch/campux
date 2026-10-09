import api from './api';

export const createOffer = async ({ listingId, offerPrice }) => {
  const response = await api.patch('/offer/createOffer', { listingId, offerPrice });
  return response.data?.data;
};

export const fetchSentOffers = async () => {
  const response = await api.get('/offer/sent');
  return response.data?.data || [];
};

export const fetchReceivedOffers = async () => {
  const response = await api.get('/offer/received');
  return response.data?.data || [];
};

export const acceptOffer = async (offerId) => {
  const response = await api.patch(`/offer/${offerId}/accept`);
  return response.data?.data;
};

export const rejectOffer = async (offerId) => {
  const response = await api.patch(`/offer/${offerId}/reject`);
  return response.data?.data;
};

export const counterOffer = async (offerId, counterOfferPrice) => {
  const response = await api.patch(`/offer/${offerId}/counter`, { counterOfferPrice });
  return response.data?.data;
};
