import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Plus, 
  Search,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SUPERVISION_TYPES = [
  { value: 'individual', label: 'Individual Supervision' },
  { value: 'group', label: 'Group Supervision' },
  { value: 'observation', label: 'Direct Observation' }
];

const TOPIC_OPTIONS = [
  'Case Consultation',
  'Documentation Review',
  'Skill Development',
  'Policy Compliance',
  'Professional Boundaries',
  'Self-Care/Burnout Prevention',
  'Crisis Management',
  'Ethics Discussion',
  'Goal Setting',
  'Performance Feedback'
];

const SupervisionPage = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewLog, setViewLog] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'individual',
    topics: [],
    notes: '',
    signedName: user?.fullName || ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStaff();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/supervision-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      toast.error('Failed to load supervision logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.topics.length === 0) {
      toast.error('Please select at least one topic');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/supervision-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Supervision log created');
        setShowAddDialog(false);
        resetForm();
        fetchLogs();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create supervision log');
      }
    } catch (error) {
      toast.error('Failed to create supervision log');
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'individual',
      topics: [],
      notes: '',
      signedName: user?.fullName || ''
    });
  };

  const toggleTopic = (topic) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const filteredLogs = logs.filter(log =>
    log.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.qpName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type) => {
    const colors = {
      individual: 'bg-blue-100 text-blue-800',
      group: 'bg-purple-100 text-purple-800',
      observation: 'bg-green-100 text-green-800'
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
    <div className="space-y-6" data-testid="supervision-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QP Supervision Logs</h1>
          <p className="text-slate-500">Document supervision sessions with staff</p>
        </div>
        {user?.role === 'qp' && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-supervision-btn">
                <Plus className="h-4 w-4 mr-2" />
                Log Supervision
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log Supervision Session</DialogTitle>
                <DialogDescription>Document a supervision session with a staff member</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff Member</Label>
                    <Select 
                      value={formData.staffId} 
                      onValueChange={(value) => setFormData({...formData, staffId: value})}
                      required
                    >
                      <SelectTrigger data-testid="supervision-staff-select">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map(member => (
                          <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      data-testid="supervision-date-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Supervision Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger data-testid="supervision-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPERVISION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topics Discussed</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPIC_OPTIONS.map(topic => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox 
                          id={topic}
                          checked={formData.topics.includes(topic)}
                          onCheckedChange={() => toggleTopic(topic)}
                        />
                        <Label htmlFor={topic} className="text-sm font-normal">{topic}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Session Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Document key points from the supervision session..."
                    rows={4}
                    required
                    data-testid="supervision-notes-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signedName">QP Signature (Type Name)</Label>
                  <Input
                    id="signedName"
                    value={formData.signedName}
                    onChange={(e) => setFormData({...formData, signedName: e.target.value})}
                    placeholder="Your full name"
                    required
                    data-testid="supervision-signature-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="supervision-submit-btn">Save Log</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="supervision-search-input"
        />
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No supervision logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card 
              key={log.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewLog(log)}
              data-testid={`supervision-log-${log.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ClipboardList className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">
                        Supervision: {log.staffName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={getTypeColor(log.type)}>
                          {SUPERVISION_TYPES.find(t => t.value === log.type)?.label || log.type}
                        </Badge>
                        <span className="flex items-center text-sm text-slate-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center text-sm text-slate-500">
                          <User className="h-4 w-4 mr-1" />
                          QP: {log.qpName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.topics?.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {log.topics?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{log.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
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
            <DialogTitle>Supervision Log Details</DialogTitle>
            <DialogDescription>
              {viewLog?.date && new Date(viewLog.date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {viewLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Staff Member</Label>
                  <p className="font-medium">{viewLog.staffName}</p>
                </div>
                <div>
                  <Label className="text-slate-500">QP Supervisor</Label>
                  <p className="font-medium">{viewLog.qpName}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Session Type</Label>
                  <p className="font-medium capitalize">{viewLog.type}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Date</Label>
                  <p className="font-medium">{new Date(viewLog.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-500">Topics Discussed</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewLog.topics?.map((topic, i) => (
                    <Badge key={i} variant="outline">{topic}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-slate-500">Session Notes</Label>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{viewLog.notes}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Signed by: <span className="font-medium text-slate-700">{viewLog.signedName}</span>
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

export default SupervisionPage;
