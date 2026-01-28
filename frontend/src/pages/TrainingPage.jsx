import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Plus, 
  Search,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TRAINING_TYPES = [
  { value: 'orientation', label: 'New Employee Orientation', required: true },
  { value: 'hipaa', label: 'HIPAA Privacy Training', required: true },
  { value: 'cpr', label: 'CPR/First Aid Certification', required: true },
  { value: 'crisis', label: 'Crisis Intervention', required: false },
  { value: 'annual_review', label: 'Annual Compliance Review', required: false },
  { value: 'de_escalation', label: 'De-escalation Training', required: false },
  { value: 'cultural_competency', label: 'Cultural Competency', required: false }
];

const TrainingPage = () => {
  const { token, hasRole } = useAuth();
  const [training, setTraining] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    staffId: '',
    trainingType: '',
    completed: false,
    completionDate: ''
  });

  useEffect(() => {
    fetchTraining();
    fetchStaff();
  }, []);

  const fetchTraining = async () => {
    try {
      const response = await fetch(`${API_URL}/api/training`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTraining(data);
      }
    } catch (error) {
      toast.error('Failed to load training records');
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
    try {
      const response = await fetch(`${API_URL}/api/training`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Training record added');
        setShowAddDialog(false);
        resetForm();
        fetchTraining();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add training record');
      }
    } catch (error) {
      toast.error('Failed to add training record');
    }
  };

  const handleToggleComplete = async (record) => {
    try {
      const response = await fetch(`${API_URL}/api/training/${record.id}?completed=${!record.completed}&completionDate=${record.completed ? '' : new Date().toISOString().split('T')[0]}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Training record updated');
        fetchTraining();
      } else {
        toast.error('Failed to update training record');
      }
    } catch (error) {
      toast.error('Failed to update training record');
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      trainingType: '',
      completed: false,
      completionDate: ''
    });
  };

  // Group training by staff
  const groupedTraining = staff.map(member => {
    const memberTraining = training.filter(t => t.staffId === member.id);
    return {
      ...member,
      training: memberTraining,
      completedCount: memberTraining.filter(t => t.completed).length,
      requiredCount: TRAINING_TYPES.filter(t => t.required).length
    };
  }).filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Records</h1>
          <p className="text-slate-500">Track staff training and certifications</p>
        </div>
        {hasRole(['admin']) && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-training-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Training Record</DialogTitle>
                <DialogDescription>Record new training for a staff member</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff Member</Label>
                  <Select 
                    value={formData.staffId} 
                    onValueChange={(value) => setFormData({...formData, staffId: value})}
                    required
                  >
                    <SelectTrigger data-testid="training-staff-select">
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
                  <Label htmlFor="trainingType">Training Type</Label>
                  <Select 
                    value={formData.trainingType} 
                    onValueChange={(value) => setFormData({...formData, trainingType: value})}
                    required
                  >
                    <SelectTrigger data-testid="training-type-select">
                      <SelectValue placeholder="Select training type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} {type.required && <span className="text-red-500">*</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="completed"
                    checked={formData.completed}
                    onCheckedChange={(checked) => setFormData({...formData, completed: checked})}
                    data-testid="training-completed-checkbox"
                  />
                  <Label htmlFor="completed">Mark as completed</Label>
                </div>
                {formData.completed && (
                  <div className="space-y-2">
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => setFormData({...formData, completionDate: e.target.value})}
                      data-testid="training-date-input"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="training-submit-btn">Add Training</Button>
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
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="training-search-input"
        />
      </div>

      {/* Training Matrix */}
      {groupedTraining.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No staff members found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedTraining.map((member) => (
            <Card key={member.id} data-testid={`training-card-${member.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.fullName}</CardTitle>
                      <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant={member.complianceStatus === 'compliant' ? 'default' : 'secondary'}>
                    {member.completedCount}/{member.requiredCount} Required
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {TRAINING_TYPES.map(type => {
                    const record = member.training.find(t => t.trainingType === type.value);
                    return (
                      <div 
                        key={type.value}
                        className={`p-3 rounded-lg border ${
                          record?.completed 
                            ? 'bg-green-50 border-green-200' 
                            : record 
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {type.label}
                              {type.required && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            {record?.completed && record.completionDate && (
                              <p className="text-xs text-slate-500 mt-1">
                                Completed: {new Date(record.completionDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {record?.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : record ? (
                            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                          )}
                        </div>
                        {record && hasRole(['admin']) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 w-full text-xs h-7"
                            onClick={() => handleToggleComplete(record)}
                          >
                            {record.completed ? 'Mark Incomplete' : 'Mark Complete'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
