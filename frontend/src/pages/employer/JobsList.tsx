import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Plus, Users, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  questions: Array<{ id: string; question_text: string; position: number }>;
}

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await api.getJobs();
      setJobs(response.jobs || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCandidate = async (jobId: string) => {
    const email = prompt('Enter candidate email:');
    if (!email) return;

    try {
      await api.inviteCandidate(jobId, email);
      alert('Invitation sent successfully!');
    } catch (error: any) {
      alert(`Failed to send invitation: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading jobs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600 mt-2">Manage your interview processes</p>
          </div>
          <Button asChild>
            <Link to="/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Link>
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-600 mb-4">Create your first job to start interviewing candidates</p>
            <Button asChild>
              <Link to="/jobs/new">Create Job</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {job.questions?.length || 0} questions • Created {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleInviteCandidate(job.id)}
                    variant="outline"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Invite Candidate
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/jobs/${job.id}/responses`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Responses
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
