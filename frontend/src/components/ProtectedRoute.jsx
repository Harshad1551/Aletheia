import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Wraps dashboard routes.
 * - Redirects unauthenticated / expired-token users to /login.
 * - Sets a 60-second polling interval to detect mid-session expiry.
 */
const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const intervalRef = useRef(null);

    useEffect(() => {
        // Poll every 60 seconds to catch token expiry mid-session
        intervalRef.current = setInterval(() => {
            if (authService.isTokenExpired()) {
                authService.logout();
                navigate('/login?reason=expired', { replace: true });
            }
        }, 60 * 1000);

        return () => clearInterval(intervalRef.current);
    }, [navigate]);

    // Immediate check on every render / navigation
    if (!authService.isAuthenticated()) {
        authService.logout(); // Ensure localStorage is clean
        return <Navigate to="/login?reason=expired" replace />;
    }

    return children;
};

export default ProtectedRoute;
