import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Download,
  FileText,
  Users,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Phone,
  FileDown
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
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

  const downloadReport = async (reportType, isPdf = false) => {
    const loadingKey = isPdf ? `${reportType}-pdf` : reportType;
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      let url = isPdf 
        ? `${API_URL}/api/reports/pdf/${reportType}`
        : `${API_URL}/api/reports/${reportType}?format=${format}`;
      
      if (dateRange.startDate) url += `${isPdf ? '?' : '&'}startDate=${dateRange.startDate}`;
      if (dateRange.endDate) url += `&endDate=${dateRange.endDate}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (isPdf) {
          // Download PDF file
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(`${reportType} PDF report downloaded`);
        } else {
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
        }
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const reports = [
    {
      id: 'incidents',
      title: 'Incident Reports',
      description: 'Export all incident reports with filters for date range and status',
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600',
      hasPdf: true
    },
    {
      id: 'supervision',
      title: 'Supervision Logs',
      description: 'Export QP supervision session records',
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-600',
      hasPdf: true
    },
    {
      id: 'staff-compliance',
      title: 'Staff Compliance',
      description: 'Export staff compliance status and training completion',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      hasPdf: true,
      pdfEndpoint: 'compliance'
    },
    {
      id: 'emergency',
      title: 'Emergency Logs',
      description: 'Export emergency response and coverage logs',
      icon: Phone,
      color: 'bg-red-100 text-red-600',
      hasPdf: true,
      dataEndpoint: false // No JSON/CSV endpoint, PDF only for now
    }
  ];

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Exports</h1>
        <p className="text-slate-500">Generate and download compliance reports in PDF, CSV, or JSON format</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Settings</CardTitle>
          <CardDescription>Configure date range and export format for data exports</CardDescription>
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
              <Label htmlFor="format">Data Export Format</Label>
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
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`report-card-${report.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
                {report.hasPdf && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <FileDown className="h-3 w-3 mr-1" />
                    PDF Available
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* PDF Download */}
              {report.hasPdf && (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={() => downloadReport(report.pdfEndpoint || report.id, true)}
                  disabled={loading[`${report.pdfEndpoint || report.id}-pdf`]}
                  data-testid={`download-${report.id}-pdf-btn`}
                >
                  {loading[`${report.pdfEndpoint || report.id}-pdf`] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF Report
                    </>
                  )}
                </Button>
              )}
              
              {/* Data Export (JSON/CSV) */}
              {report.dataEndpoint !== false && (
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => downloadReport(report.id)}
                  disabled={loading[report.id]}
                  data-testid={`download-${report.id}-btn`}
                >
                  {loading[report.id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download {format.toUpperCase()} Data
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF Report Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            PDF Report Features
          </CardTitle>
          <CardDescription>Professional, audit-ready PDF reports include:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-100 rounded">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-medium text-sm">NON-PHI Banner</span>
              </div>
              <p className="text-xs text-slate-500">Clear compliance indicator on every page</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-sm">Summary Stats</span>
              </div>
              <p className="text-xs text-slate-500">Quick overview of key metrics</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 rounded">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-sm">Detailed Records</span>
              </div>
              <p className="text-xs text-slate-500">Full documentation of each entry</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-100 rounded">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Date Filtering</span>
              </div>
              <p className="text-xs text-slate-500">Reports filtered by date range</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Available Report Types
          </CardTitle>
          <CardDescription>Summary of available data for reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg text-center border border-amber-100">
              <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">Incidents</p>
              <p className="text-xs text-slate-500">PDF, CSV, JSON</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-100">
              <ClipboardList className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">Supervision</p>
              <p className="text-xs text-slate-500">PDF, CSV, JSON</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
              <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">Compliance</p>
              <p className="text-xs text-slate-500">PDF, CSV, JSON</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
              <Phone className="h-6 w-6 mx-auto text-red-500 mb-2" />
              <p className="text-sm font-medium text-slate-700">Emergency</p>
              <p className="text-xs text-slate-500">PDF</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
