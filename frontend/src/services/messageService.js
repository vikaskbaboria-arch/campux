import api from './api';

export const fetchConversations = async () => {
  const response = await api.get('/conversations');
  const conversations = response.data?.data;
  return Array.isArray(conversations) ? conversations : [];
};

export const createConversation = async (recipientId) => {
  const response = await api.post('/conversations', { recipientId });
  return response.data?.data;
};

export const fetchConversation = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data?.data;
};

export const fetchMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  const messages = response.data?.data;
  return Array.isArray(messages) ? messages : [];
};

export const sendMessage = async ({ conversationId, text }) => {
  const response = await api.post('/messages', { conversationId, text });
  return response.data?.data;
};

export const markMessageAsRead = async (messageId) => {
  const response = await api.patch(`/messages/${messageId}/read`);
  return response.data?.data;
};
