import { Navigate, Route, Routes } from 'react-router-dom'

import { ImpactPage } from '@/pages/ImpactPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ImpactPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
