import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Download,
  FileText,
  Users,
  AlertTriangle,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReportsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [format, setFormat] = useState('json');

  const downloadReport = async (reportType) => {
    setLoading(prev => ({ ...prev, [reportType]: true }));
    
    try {
      let url = `${API_URL}/api/reports/${reportType}?format=${format}`;
      if (dateRange.startDate) url += `&startDate=${dateRange.startDate}`;
      if (dateRange.endDate) url += `&endDate=${dateRange.endDate}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (format === 'csv' && data.csv) {
          // Download as CSV file
          const blob = new Blob([data.csv], { type: 'text/csv' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(`${reportType} report downloaded`);
        } else {
          // Download as JSON file
          const blob = new Blob([JSON.stringify(data.data || data, null, 2)], { type: 'application/json' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(`${reportType} report downloaded (${data.count || 0} records)`);
        }
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const reports = [
    {
      id: 'incidents',
      title: 'Incident Reports',
      description: 'Export all incident reports with filters for date range and status',
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      id: 'supervision',
      title: 'Supervision Logs',
      description: 'Export QP supervision session records',
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'staff-compliance',
      title: 'Staff Compliance',
      description: 'Export staff compliance status and training completion',
      icon: Users,
      color: 'bg-blue-100 text-blue-600'
    }
  ];

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Exports</h1>
        <p className="text-slate-500">Generate and download compliance reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Settings</CardTitle>
          <CardDescription>Configure date range and export format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                data-testid="report-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                data-testid="report-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger data-testid="report-format-select">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`report-card-${report.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => downloadReport(report.id)}
                disabled={loading[report.id]}
                data-testid={`download-${report.id}-btn`}
              >
                {loading[report.id] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download {format.toUpperCase()}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Report Overview
          </CardTitle>
          <CardDescription>Summary of available data for reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <FileText className="h-6 w-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Policies</p>
              <p className="text-lg font-semibold text-slate-900">Available</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <Users className="h-6 w-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Staff Records</p>
              <p className="text-lg font-semibold text-slate-900">Available</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <AlertTriangle className="h-6 w-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Incidents</p>
              <p className="text-lg font-semibold text-slate-900">Available</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <Calendar className="h-6 w-6 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">On-Call Logs</p>
              <p className="text-lg font-semibold text-slate-900">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
