import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './contexts/AuthContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import FamiliesPage from './pages/Families'
import CalendarPage from './pages/Calendar'
import AttendancePage from './pages/Attendance'
import LibraryPage from './pages/Library'
import DimDimPage from './pages/DimDim'
import SettingsPage from './pages/Settings'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/familias" element={<FamiliesPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/presenca" element={<AttendancePage />} />
            <Route path="/biblioteca" element={<LibraryPage />} />
            <Route path="/dimdim" element={<DimDimPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
