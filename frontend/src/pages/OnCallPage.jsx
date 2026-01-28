import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Search,
  User,
  Phone,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OnCallPage = () => {
  const { token, hasRole } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    staffId: '',
    coverageDate: new Date().toISOString().split('T')[0],
    timeRange: '8:00 AM - 8:00 PM',
    backupContact: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssignments();
    fetchStaff();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/oncall`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      toast.error('Failed to load on-call assignments');
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
        setStaff(data.filter(s => s.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/oncall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('On-call assignment saved');
        setShowAddDialog(false);
        resetForm();
        fetchAssignments();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save assignment');
      }
    } catch (error) {
      toast.error('Failed to save assignment');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const response = await fetch(`${API_URL}/api/oncall/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Assignment deleted');
        fetchAssignments();
      } else {
        toast.error('Failed to delete assignment');
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      coverageDate: new Date().toISOString().split('T')[0],
      timeRange: '8:00 AM - 8:00 PM',
      backupContact: '',
      notes: ''
    });
  };

  const handleDateClick = (date) => {
    if (hasRole(['admin'])) {
      setFormData({ ...formData, coverageDate: date });
      setShowAddDialog(true);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    // Add empty cells for padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const assignment = assignments.find(a => a.coverageDate === dateStr);
      days.push({
        day,
        date: dateStr,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        assignment
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="oncall-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">On-Call Schedule</h1>
          <p className="text-slate-500">Manage on-call coverage assignments</p>
        </div>
        {hasRole(['admin']) && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-oncall-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule On-Call Coverage</DialogTitle>
                <DialogDescription>Assign a staff member for on-call coverage</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff Member</Label>
                  <Select 
                    value={formData.staffId} 
                    onValueChange={(value) => setFormData({...formData, staffId: value})}
                    required
                  >
                    <SelectTrigger data-testid="oncall-staff-select">
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
                  <Label htmlFor="coverageDate">Coverage Date</Label>
                  <Input
                    id="coverageDate"
                    type="date"
                    value={formData.coverageDate}
                    onChange={(e) => setFormData({...formData, coverageDate: e.target.value})}
                    required
                    data-testid="oncall-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeRange">Time Range</Label>
                  <Select 
                    value={formData.timeRange} 
                    onValueChange={(value) => setFormData({...formData, timeRange: value})}
                  >
                    <SelectTrigger data-testid="oncall-time-select">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8:00 AM - 8:00 PM">8:00 AM - 8:00 PM (Day)</SelectItem>
                      <SelectItem value="8:00 PM - 8:00 AM">8:00 PM - 8:00 AM (Night)</SelectItem>
                      <SelectItem value="24 Hours">24 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupContact">Backup Contact (Optional)</Label>
                  <Input
                    id="backupContact"
                    value={formData.backupContact}
                    onChange={(e) => setFormData({...formData, backupContact: e.target.value})}
                    placeholder="Name and phone number"
                    data-testid="oncall-backup-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special instructions..."
                    rows={2}
                    data-testid="oncall-notes-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="oncall-submit-btn">Save Assignment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayData, index) => (
              <div 
                key={index}
                className={`
                  min-h-24 p-2 rounded-lg border transition-colors
                  ${dayData ? 'cursor-pointer hover:bg-slate-50' : ''}
                  ${dayData?.isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
                  ${dayData?.assignment ? 'bg-green-50' : ''}
                `}
                onClick={() => dayData && handleDateClick(dayData.date)}
              >
                {dayData && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${dayData.isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                      {dayData.day}
                    </div>
                    {dayData.assignment && (
                      <div className="text-xs">
                        <div className="flex items-center gap-1 text-green-700 font-medium">
                          <User className="h-3 w-3" />
                          <span className="truncate">{dayData.assignment.staffName}</span>
                        </div>
                        <div className="text-slate-500 mt-1 truncate">
                          {dayData.assignment.timeRange}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming On-Call Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No on-call assignments scheduled
            </div>
          ) : (
            <div className="space-y-3">
              {assignments
                .filter(a => new Date(a.coverageDate) >= new Date(new Date().toDateString()))
                .sort((a, b) => new Date(a.coverageDate) - new Date(b.coverageDate))
                .slice(0, 10)
                .map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    data-testid={`oncall-assignment-${assignment.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(assignment.coverageDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {assignment.coverageDate === new Date().toISOString().split('T')[0] && (
                            <Badge className="bg-blue-100 text-blue-800">Today</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                          <User className="h-4 w-4" />
                          <span>{assignment.staffName}</span>
                          <span>•</span>
                          <span>{assignment.timeRange}</span>
                        </div>
                        {assignment.backupContact && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Phone className="h-3 w-3" />
                            <span>Backup: {assignment.backupContact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {hasRole(['admin']) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(assignment.id)}
                        data-testid={`delete-oncall-${assignment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnCallPage;
