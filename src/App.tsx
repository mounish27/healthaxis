import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import PatientDashboard from './pages/PatientDashboard';
import AppointmentBooking from './pages/AppointmentBooking';
import PatientCare from './pages/PatientCare';
import PatientRecords from './pages/PatientRecords';
import Layout from './components/Layout';
import AIHealthAssistant from './components/AIHealthAssistant';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/patient-records" element={<PatientRecords />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-care" element={<PatientCare />} />
          <Route path="/book-appointment" element={<AppointmentBooking />} />
          <Route path="/ai-assistant" element={<AIHealthAssistant />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App