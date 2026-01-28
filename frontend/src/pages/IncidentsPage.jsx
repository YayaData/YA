import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Plus, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const INCIDENT_TYPES = [
  { value: 'safety', label: 'Safety Incident' },
  { value: 'behavioral', label: 'Behavioral Incident' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' }
];

const STATUSES = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'closed', label: 'Closed' }
];

const IncidentsPage = () => {
  const { token, hasRole, user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewIncident, setViewIncident] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    incidentType: '',
    location: '',
    clientRef: '',
    description: '',
    actionsTaken: '',
    supervisorNotified: false,
    followUpRequired: false
  });

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    try {
      let url = `${API_URL}/api/incidents`;
      if (statusFilter && statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (error) {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Incident report submitted');
        setShowAddDialog(false);
        resetForm();
        fetchIncidents();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to submit incident');
      }
    } catch (error) {
      toast.error('Failed to submit incident');
    }
  };

  const handleUpdateStatus = async (incidentId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reviewedBy: user?.fullName })
      });

      if (response.ok) {
        toast.success('Incident status updated');
        fetchIncidents();
        setViewIncident(null);
      } else {
        toast.error('Failed to update incident');
      }
    } catch (error) {
      toast.error('Failed to update incident');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      incidentType: '',
      location: '',
      clientRef: '',
      description: '',
      actionsTaken: '',
      supervisorNotified: false,
      followUpRequired: false
    });
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.clientRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      reviewed: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      safety: 'bg-red-100 text-red-800',
      behavioral: 'bg-purple-100 text-purple-800',
      environmental: 'bg-teal-100 text-teal-800',
      other: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="incidents-page">
      {/* Non-PHI Warning */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>NON-PHI:</strong> Use only client initials or non-identifying reference codes. 
          Do not enter full names, SSN, DOB, addresses, or Medicaid IDs.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incident Reports</h1>
          <p className="text-slate-500">Document and track non-PHI incident reports</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-incident-btn">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Document an incident using non-identifying client references only
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    data-testid="incident-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                    data-testid="incident-time-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentType">Incident Type</Label>
                  <Select 
                    value={formData.incidentType} 
                    onValueChange={(value) => setFormData({...formData, incidentType: value})}
                    required
                  >
                    <SelectTrigger data-testid="incident-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Main Office, Community Site"
                    required
                    data-testid="incident-location-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientRef">Client Reference (Non-PHI)</Label>
                <Input
                  id="clientRef"
                  value={formData.clientRef}
                  onChange={(e) => setFormData({...formData, clientRef: e.target.value})}
                  placeholder="Initials or non-identifying ID only (e.g., JD, Client-042)"
                  required
                  data-testid="incident-clientref-input"
                />
                <p className="text-xs text-slate-500">Use initials or internal reference codes only</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Incident Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what happened..."
                  rows={3}
                  required
                  data-testid="incident-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionsTaken">Actions Taken</Label>
                <Textarea
                  id="actionsTaken"
                  value={formData.actionsTaken}
                  onChange={(e) => setFormData({...formData, actionsTaken: e.target.value})}
                  placeholder="What steps were taken to address the incident..."
                  rows={3}
                  required
                  data-testid="incident-actions-input"
                />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="supervisorNotified"
                    checked={formData.supervisorNotified}
                    onCheckedChange={(checked) => setFormData({...formData, supervisorNotified: checked})}
                    data-testid="incident-supervisor-checkbox"
                  />
                  <Label htmlFor="supervisorNotified">Supervisor Notified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onCheckedChange={(checked) => setFormData({...formData, followUpRequired: checked})}
                    data-testid="incident-followup-checkbox"
                  />
                  <Label htmlFor="followUpRequired">Follow-up Required</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="incident-submit-btn">Submit Report</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="incident-search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="incident-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No incidents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <Card 
              key={incident.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewIncident(incident)}
              data-testid={`incident-card-${incident.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {INCIDENT_TYPES.find(t => t.value === incident.incidentType)?.label || incident.incidentType}
                        </h3>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {incident.status === 'reviewed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {incident.status === 'closed' && <XCircle className="h-3 w-3 mr-1" />}
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                        <span>{new Date(incident.date).toLocaleDateString()} at {incident.time}</span>
                        <span>•</span>
                        <span>{incident.location}</span>
                        <span>•</span>
                        <span>Client: {incident.clientRef}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {incident.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {incident.supervisorNotified && (
                          <Badge variant="outline" className="text-xs">Supervisor Notified</Badge>
                        )}
                        {incident.followUpRequired && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Follow-up Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Incident Dialog */}
      <Dialog open={!!viewIncident} onOpenChange={() => setViewIncident(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Incident Report Details</DialogTitle>
            <DialogDescription>
              Reported on {viewIncident?.date} at {viewIncident?.time}
            </DialogDescription>
          </DialogHeader>
          {viewIncident && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(viewIncident.incidentType)}>
                  {INCIDENT_TYPES.find(t => t.value === viewIncident.incidentType)?.label}
                </Badge>
                <Badge className={getStatusColor(viewIncident.status)}>
                  {viewIncident.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Location</Label>
                  <p className="font-medium">{viewIncident.location}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Client Reference</Label>
                  <p className="font-medium">{viewIncident.clientRef}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-slate-500">Description</Label>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewIncident.description}</p>
              </div>
              
              <div>
                <Label className="text-slate-500">Actions Taken</Label>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewIncident.actionsTaken}</p>
              </div>
              
              <div className="flex gap-4">
                <div>
                  <Label className="text-slate-500">Supervisor Notified</Label>
                  <p className="font-medium">{viewIncident.supervisorNotified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Follow-up Required</Label>
                  <p className="font-medium">{viewIncident.followUpRequired ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {viewIncident.reviewedBy && (
                <div>
                  <Label className="text-slate-500">Reviewed By</Label>
                  <p className="font-medium">{viewIncident.reviewedBy}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Reported by: <span className="font-medium text-slate-700">{viewIncident.createdByName || 'Unknown'}</span>
                </p>
              </div>
              
              {hasRole(['admin', 'qp']) && viewIncident.status !== 'closed' && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {viewIncident.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpdateStatus(viewIncident.id, 'reviewed')}
                    >
                      Mark as Reviewed
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleUpdateStatus(viewIncident.id, 'closed')}
                  >
                    Close Incident
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentsPage;
