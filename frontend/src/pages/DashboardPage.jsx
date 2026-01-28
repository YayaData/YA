import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  Phone,
  CheckCircle,
  Clock,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardPage = () => {
  const { user, token, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Policies',
      value: stats?.totalPolicies || 0,
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Active policy documents',
      show: true
    },
    {
      title: 'Active Staff',
      value: stats?.activeStaff || 0,
      icon: Users,
      color: 'bg-emerald-500',
      description: `of ${stats?.totalStaff || 0} total staff`,
      show: hasRole(['admin', 'qp'])
    },
    {
      title: 'Pending Incidents',
      value: stats?.pendingIncidents || 0,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      description: `${stats?.totalIncidents || 0} total reports`,
      show: true
    },
    {
      title: 'Emergency Logs',
      value: stats?.totalEmergencyLogs || 0,
      icon: Phone,
      color: 'bg-red-500',
      description: 'Total emergency responses',
      show: true
    },
    {
      title: 'Supervision Logs',
      value: stats?.totalSupervisionLogs || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      description: 'QP supervision sessions',
      show: hasRole(['admin', 'qp'])
    },
    {
      title: 'Compliant Staff',
      value: stats?.compliantStaff || 0,
      icon: UserCheck,
      color: 'bg-teal-500',
      description: `${stats?.pendingCompliance || 0} pending compliance`,
      show: hasRole(['admin', 'qp'])
    }
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.fullName}
        </h1>
        <p className="text-slate-500 mt-1">
          Here's an overview of your compliance toolkit
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.filter(card => card.show).map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{card.value}</div>
              <p className="text-xs text-slate-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's On-Call */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Today's On-Call Coverage
          </CardTitle>
          <CardDescription>Current emergency response contact</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.todayOnCall ? (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-600 rounded-full">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg text-slate-900">{stats.todayOnCall}</p>
                <p className="text-sm text-slate-500">On-call for today</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="p-3 bg-amber-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg text-slate-900">No coverage assigned</p>
                <p className="text-sm text-slate-500">Schedule on-call staff for today</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions based on role */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hasRole(['admin', 'qp', 'staff']) && (
              <a 
                href="/policies" 
                className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                data-testid="quick-action-policies"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">View Policies</span>
              </a>
            )}
            {hasRole(['admin', 'qp', 'staff']) && (
              <a 
                href="/incidents" 
                className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-center"
                data-testid="quick-action-incidents"
              >
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <span className="text-sm font-medium">Report Incident</span>
              </a>
            )}
            {hasRole(['admin', 'qp', 'staff']) && (
              <a 
                href="/emergency" 
                className="p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors text-center"
                data-testid="quick-action-emergency"
              >
                <Phone className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <span className="text-sm font-medium">Log Emergency</span>
              </a>
            )}
            {hasRole(['qp']) && (
              <a 
                href="/supervision" 
                className="p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
                data-testid="quick-action-supervision"
              >
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">Log Supervision</span>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
