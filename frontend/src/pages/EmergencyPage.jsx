import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  Plus, 
  Search,
  AlertCircle,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EMERGENCY_TYPES = [
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'behavioral', label: 'Behavioral Crisis' },
  { value: 'environmental', label: 'Environmental Emergency' },
  { value: 'other', label: 'Other Emergency' }
];

const EmergencyPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewLog, setViewLog] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    emergencyType: '',
    clientRef: '',
    responseTaken: '',
    outcome: '',
    followUp: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/emergency-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      toast.error('Failed to load emergency logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/emergency-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Emergency log created');
        setShowAddDialog(false);
        resetForm();
        fetchLogs();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create emergency log');
      }
    } catch (error) {
      toast.error('Failed to create emergency log');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      emergencyType: '',
      clientRef: '',
      responseTaken: '',
      outcome: '',
      followUp: ''
    });
  };

  const filteredLogs = logs.filter(log =>
    log.clientRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.responseTaken?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.outcome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type) => {
    const colors = {
      medical: 'bg-red-100 text-red-800',
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
    <div className="space-y-6" data-testid="emergency-page">
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
          <h1 className="text-2xl font-bold text-slate-900">Emergency Coverage Logs</h1>
          <p className="text-slate-500">Document emergency responses and outcomes</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700" data-testid="add-emergency-btn">
              <Plus className="h-4 w-4 mr-2" />
              Log Emergency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log Emergency Response</DialogTitle>
              <DialogDescription>
                Document an emergency using non-identifying client references only
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
                    data-testid="emergency-date-input"
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
                    data-testid="emergency-time-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyType">Emergency Type</Label>
                  <Select 
                    value={formData.emergencyType} 
                    onValueChange={(value) => setFormData({...formData, emergencyType: value})}
                    required
                  >
                    <SelectTrigger data-testid="emergency-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMERGENCY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientRef">Client Reference (Non-PHI)</Label>
                  <Input
                    id="clientRef"
                    value={formData.clientRef}
                    onChange={(e) => setFormData({...formData, clientRef: e.target.value})}
                    placeholder="Initials or non-identifying ID"
                    required
                    data-testid="emergency-clientref-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responseTaken">Response Taken</Label>
                <Textarea
                  id="responseTaken"
                  value={formData.responseTaken}
                  onChange={(e) => setFormData({...formData, responseTaken: e.target.value})}
                  placeholder="Describe the emergency response actions..."
                  rows={3}
                  required
                  data-testid="emergency-response-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea
                  id="outcome"
                  value={formData.outcome}
                  onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                  placeholder="Describe the outcome of the emergency response..."
                  rows={2}
                  required
                  data-testid="emergency-outcome-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUp">Follow-up Actions (Optional)</Label>
                <Textarea
                  id="followUp"
                  value={formData.followUp}
                  onChange={(e) => setFormData({...formData, followUp: e.target.value})}
                  placeholder="Any required follow-up actions..."
                  rows={2}
                  data-testid="emergency-followup-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700" data-testid="emergency-submit-btn">
                  Save Log
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search emergency logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="emergency-search-input"
        />
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No emergency logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card 
              key={log.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewLog(log)}
              data-testid={`emergency-log-${log.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Phone className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {EMERGENCY_TYPES.find(t => t.value === log.emergencyType)?.label || log.emergencyType}
                        </h3>
                        <Badge className={getTypeColor(log.emergencyType)}>
                          {log.emergencyType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(log.date).toLocaleDateString()} at {log.time}
                        </span>
                        <span>•</span>
                        <span>Client: {log.clientRef}</span>
                        {log.onCallStaffName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              On-call: {log.onCallStaffName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {log.responseTaken}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Log Dialog */}
      <Dialog open={!!viewLog} onOpenChange={() => setViewLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency Log Details</DialogTitle>
            <DialogDescription>
              {viewLog?.date && new Date(viewLog.date).toLocaleDateString()} at {viewLog?.time}
            </DialogDescription>
          </DialogHeader>
          {viewLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(viewLog.emergencyType)}>
                  {EMERGENCY_TYPES.find(t => t.value === viewLog.emergencyType)?.label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Client Reference</Label>
                  <p className="font-medium">{viewLog.clientRef}</p>
                </div>
                {viewLog.onCallStaffName && (
                  <div>
                    <Label className="text-slate-500">On-Call Staff</Label>
                    <p className="font-medium">{viewLog.onCallStaffName}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-slate-500">Response Taken</Label>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewLog.responseTaken}</p>
              </div>
              
              <div>
                <Label className="text-slate-500">Outcome</Label>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewLog.outcome}</p>
              </div>
              
              {viewLog.followUp && (
                <div>
                  <Label className="text-slate-500">Follow-up Actions</Label>
                  <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewLog.followUp}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Logged by: <span className="font-medium text-slate-700">{viewLog.createdByName || 'Unknown'}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Created: {new Date(viewLog.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencyPage;
