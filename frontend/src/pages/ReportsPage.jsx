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
  FileDown,
  Package,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReportsPage = () => {
  const { token, hasRole } = useAuth();
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
      description: 'Export all incident reports with date, type, location, and status',
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600',
      hasPdf: true
    },
    {
      id: 'supervision',
      title: 'QP Supervision Logs',
      description: 'Export supervision session records with staff, topics, and notes',
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-600',
      hasPdf: true
    },
    {
      id: 'staff-compliance',
      title: 'Training & Compliance',
      description: 'Export staff training records and compliance status',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      hasPdf: true,
      pdfEndpoint: 'compliance'
    },
    {
      id: 'emergency',
      title: 'Emergency Coverage',
      description: 'Export emergency response logs with outcomes',
      icon: Phone,
      color: 'bg-red-100 text-red-600',
      hasPdf: true,
      dataEndpoint: false
    }
  ];

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Exports</h1>
        <p className="text-slate-500">Generate audit-ready compliance reports in PDF format</p>
      </div>

      {/* Audit Packet Banner */}
      {hasRole(['admin']) && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Compliance Audit Packet</h2>
                  <p className="text-blue-100 mt-1">
                    Download a complete audit-ready PDF containing all compliance reports in one document
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-0">Staff Compliance</Badge>
                    <Badge className="bg-white/20 text-white border-0">Incidents</Badge>
                    <Badge className="bg-white/20 text-white border-0">Supervision</Badge>
                    <Badge className="bg-white/20 text-white border-0">Emergency</Badge>
                  </div>
                </div>
              </div>
              <Button 
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => downloadReport('audit-packet', true)}
                disabled={loading['audit-packet-pdf']}
                data-testid="download-audit-packet-btn"
              >
                {loading['audit-packet-pdf'] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-5 w-5 mr-2" />
                    Download Audit Packet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Date Range</CardTitle>
          <CardDescription>Select the period for your reports</CardDescription>
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

      {/* Individual Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`report-card-${report.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <FileDown className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* PDF Download */}
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

      {/* PDF Report Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Audit-Ready PDF Reports Include:</strong> Agency name, report period, generation timestamp, page numbers, NON-PHI compliance disclaimer, summary statistics, and detailed records.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReportsPage;
