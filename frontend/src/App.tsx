import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './features/auth/pages/AuthPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import ProtectedRoute from './app/router/ProtectedRout';

function App() {

  return (
    <BrowserRouter>
    {/* Routes */}
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
