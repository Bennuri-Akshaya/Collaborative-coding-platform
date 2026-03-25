import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import CreateRoom from './pages/CreateRoom';
// import Editor from './pages/Editor';
import Editor from './pages/editor1.jsx'
import Auth from './pages/Auth.jsx';
import ProtectedRoute from './pages/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
      <Route path="/create-room" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
      <Route path="/editor/:roomId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;