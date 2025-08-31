import { Routes, Route } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

export function AdminPanel() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your platform settings and data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Jobs</h3>
            <p className="text-gray-600 text-sm mb-4">Manage interview jobs and positions</p>
            <Button asChild>
              <Link to="/admin/jobs">Manage Jobs</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team</h3>
            <p className="text-gray-600 text-sm mb-4">Manage team members and permissions</p>
            <Button asChild>
              <Link to="/admin/team">Manage Team</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Keys</h3>
            <p className="text-gray-600 text-sm mb-4">Manage API access and integrations</p>
            <Button asChild>
              <Link to="/admin/api-keys">Manage API Keys</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Bank</h3>
            <p className="text-gray-600 text-sm mb-4">Manage interview questions</p>
            <Button asChild>
              <Link to="/admin/question-bank">Question Bank</Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Responses</h3>
            <p className="text-gray-600 text-sm mb-4">View and analyze interview responses</p>
            <Button asChild>
              <Link to="/admin/responses">View Responses</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
