import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AnnouncementBanner from './components/AnnouncementBanner';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import College from './pages/College';
import ListingDetails from './pages/ListingDetails';
import CreatePost from './pages/CreatePost';
import Messages from './pages/Messages';
import Offers from './pages/Offers';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

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
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-[#121215] p-7 text-center">
            <h1 className="text-base font-semibold text-white">Messages could not load</h1>
            <p className="mt-2 break-words text-xs text-zinc-400">
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
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hideFooter = location.pathname.startsWith('/messages');

  // Close mobile sidebar on page navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Template Announcement Banner */}
      <AnnouncementBanner />

      {/* Main Layout Container with Sidebar and Content */}
      <div className="flex flex-1 min-h-0 w-full relative">
        {/* Left Template Sidebar - only rendered when user is logged in */}
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Content Viewport */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#08080a]">
          {/* Top Bar with Breadcrumbs & Theme Toggle */}
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

          {/* Route Content */}
          <main className="flex-1 flex flex-col w-full min-h-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dedicated Post Page routes */}
              <Route path="/post/:listingId" element={<ListingDetails />} />
              <Route path="/listing/:listingId" element={<ListingDetails />} />

              {/* Dedicated Create Post Page routes */}
              <Route
                path="/post/new"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/offers"
                element={
                  <ProtectedRoute>
                    <Offers />
                  </ProtectedRoute>
                }
              />
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
      </div>
    </div>
  );
}

export default App;
