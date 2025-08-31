import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Play } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function CandidatePage() {
  const [availableJobs] = useState([
    { id: 'demo-job-1', title: 'Frontend Developer Interview', description: 'React & TypeScript position' },
    { id: 'demo-job-2', title: 'Full Stack Engineer', description: 'Node.js & React position' }
  ]);
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome Candidate</h1>
            <p className="text-gray-600 mb-6">Please log in to access your interviews</p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidate Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.email}</p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Interviews</h2>
            
            {availableJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No interviews available</p>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600 text-sm">{job.description}</p>
                    </div>
                    <Button asChild>
                      <Link to={`/interview/${job.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Interview
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview History</h2>
            <p className="text-gray-500 text-center py-8">No completed interviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}
