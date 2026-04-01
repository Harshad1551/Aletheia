import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Wraps public-only routes like /login and /signup.
 * - If the user is already authenticated, redirects them to their
 *   correct dashboard based on the role stored in localStorage.
 * - Prevents back-navigation from a dashboard to the login page.
 */
const PublicOnlyRoute = ({ children }) => {
    if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        const role = user?.user?.role;

        // Send to the right dashboard based on role
        if (role === 'therapist') {
            return <Navigate to="/therapist-dashboard" replace />;
        }
        return <Navigate to="/client-dashboard" replace />;
    }

    return children;
};

export default PublicOnlyRoute;
