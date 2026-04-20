import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Home'; 
import Login from './pages/Login';       
import Dashboard from './pages/Dashboard'; 
import Upload from './pages/Upload';
import OfficerPortal from './OfficerPortal'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. FIRST PAGE: localhost:5173 loads the Login page */}
        <Route path="/" element={<Login />} />
        
        {/* 2. THE WEBSITE: Pages they access AFTER logging in */}
        <Route path="/home" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/officer" element={<OfficerPortal />} />
      </Routes>
    </Router>
  );
}

export default App;