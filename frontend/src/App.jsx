import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import College from './pages/College';
import ListingDetails from './pages/ListingDetails';
import Messages from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';

class MessagesErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Messages page failed to render:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#0a0a0a] p-7 text-center">
            <h1 className="text-lg font-semibold text-white">Messages could not load</h1>
            <p className="mt-2 break-words text-sm text-zinc-400">
              Refresh the page and try again. If the problem continues, sign out and sign back in.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      <Navbar />
      <main className="flex-1 flex flex-col w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listing/:listingId" element={<ListingDetails />} />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesErrorBoundary>
                  <Messages />
                </MessagesErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute>
                <MessagesErrorBoundary>
                  <Messages />
                </MessagesErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* User by ID routes */}
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/user/:userId" element={<Profile />} />

          {/* College details routes */}
          <Route path="/college/:collegeId" element={<College />} />
          <Route path="/colleges/:collegeId" element={<College />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
