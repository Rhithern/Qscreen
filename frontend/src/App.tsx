import { Routes, Route } from 'react-router-dom'
import { GlobalHeader } from './components/layout/GlobalHeader'
import { GlobalFooter } from './components/layout/GlobalFooter'
import { AnimatedToaster } from './components/ui/animated-toast'
import { HomePage } from './pages/HomePage'
import { AuthLogin } from './pages/auth/Login'
import { AuthRegister } from './pages/auth/Register'
import { Dashboard } from './pages/Dashboard'
import { CreateJob } from './pages/employer/CreateJob'
import { JobsList } from './pages/employer/JobsList'
import { InterviewSession } from './pages/candidate/InterviewSession'
import { CandidatePage } from './pages/candidate/CandidatePage'
import { AdminPanel } from './pages/admin/AdminPanel'
import { NotFound } from './pages/NotFound'
import { getSiteContent } from './lib/content'

function App() {
  const siteContent = getSiteContent()

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader siteContent={siteContent} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/auth/register" element={<AuthRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs/new" element={<CreateJob />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/interview/:jobId" element={<InterviewSession />} />
          <Route path="/candidate" element={<CandidatePage />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <GlobalFooter siteContent={siteContent} />
      <AnimatedToaster />
    </div>
  )
}

export default App
