import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import CreateRoom from './pages/CreateRoom';
import Editor from './pages/Editor';
import Auth from './pages/Auth.jsx';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/editor/:roomId" element={<Editor />} />
    </Routes>
  );
}

export default App;