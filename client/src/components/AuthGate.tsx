import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import LoginForm from './LoginForm';
import EventRegistrationForm from './EventRegistrationForm';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isRegistered, loading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login/registration
  if (!user) {
    if (showRegistration) {
      return (
        <EventRegistrationForm 
          isInitialRegistration={true}
          onBack={() => setShowRegistration(false)}
        />
      );
    }
    
    return (
      <LoginForm onSwitchToRegister={() => setShowRegistration(true)} />
    );
  }

  // If user is authenticated but not registered, show registration form
  if (!isRegistered) {
    return (
      <EventRegistrationForm 
        isInitialRegistration={true}
      />
    );
  }

  // User is authenticated and registered, show the main app
  return <>{children}</>;
};

export default AuthGate;