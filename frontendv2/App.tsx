import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatInterfaceNoRedux } from './components/ChatInterfaceNoRedux';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import { TOKEN } from './config/Config';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(TOKEN);
  return token ? <>{children}</> : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden bg-[#111b21]">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInterfaceNoRedux />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
