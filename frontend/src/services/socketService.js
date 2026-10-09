import { io } from 'socket.io-client';

export const connectMessageSocket = () => {
  const socketUrl = (
    import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin
  )
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');

  return io(socketUrl, {
    path: '/socket.io',
    withCredentials: true,
    auth: (callback) => {
      callback({ token: localStorage.getItem('campux_token') });
    },
  });
};
