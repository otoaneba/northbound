import { useNavigate } from 'react-router-dom';
import { logout } from '../../../features/auth/services/authService';

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </aside>
  );
}
