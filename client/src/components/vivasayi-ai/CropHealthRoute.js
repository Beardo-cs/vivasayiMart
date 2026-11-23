import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { canUseCropHealth } from './access';

// Goes inside PrivateRoute, which already handles people who aren't logged in.
const CropHealthRoute = ({ children }) => {
  const { user, loading } = useSelector(state => state.auth);
  if (loading || !user) return null;
  return canUseCropHealth(user) ? children : <Navigate to="/dashboard" replace />;
};

export default CropHealthRoute;
