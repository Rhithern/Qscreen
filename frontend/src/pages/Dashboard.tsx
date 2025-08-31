import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Plus, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const userType = user.user_metadata?.user_type || 'employer';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userType === 'employer' ? 'Employer Dashboard' : 'Candidate Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Job</h3>
                <p className="text-gray-600 text-sm">Start a new interview process</p>
              </div>
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <Button asChild className="w-full mt-4">
              <Link to="/jobs/new">Create Job</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Team</h3>
                <p className="text-gray-600 text-sm">Manage team members</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/jobs">View Jobs</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <p className="text-gray-600 text-sm">View performance metrics</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
