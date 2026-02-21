import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, logoutUser, clearError } from '../authSlice';

/**
 * useAuth - Provides auth state and actions to components.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
      return true;
    }
    return false;
  };

  const register = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      // Don't auto-navigate — let the page show a success screen
      return true;
    }
    return false;
  };

  const logout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const dismissError = () => dispatch(clearError());

  return { user, isAuthenticated, loading, error, login, register, logout, dismissError };
}
