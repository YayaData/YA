import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  UserCheck,
  Clock,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'qp', label: 'Qualified Professional' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Administrator' }
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'onboarding', label: 'Onboarding' }
];

const StaffPage = () => {
  const { token, hasRole } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'staff',
    email: '',
    phone: '',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

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
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingStaff 
        ? `${API_URL}/api/staff/${editingStaff.id}`
        : `${API_URL}/api/staff`;
      
      const response = await fetch(url, {
        method: editingStaff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingStaff ? 'Staff updated' : 'Staff member added');
        setShowAddDialog(false);
        setEditingStaff(null);
        resetForm();
        fetchStaff();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`${API_URL}/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Staff member deleted');
        fetchStaff();
      } else {
        toast.error('Failed to delete staff member');
      }
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const openEditDialog = (member) => {
    setFormData({
      fullName: member.fullName,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      hireDate: member.hireDate,
      status: member.status
    });
    setEditingStaff(member);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      role: 'staff',
      email: '',
      phone: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  };

  const filteredStaff = staff.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-slate-100 text-slate-800',
      onboarding: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getComplianceColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-800',
      pending: 'bg-amber-100 text-amber-800',
      'non-compliant': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="staff-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500">Manage staff records and compliance status</p>
        </div>
        {hasRole(['admin']) && (
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingStaff(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-staff-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
                <DialogDescription>
                  {editingStaff ? 'Update staff information' : 'Add a new staff member to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                    required
                    data-testid="staff-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger data-testid="staff-role-select">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger data-testid="staff-status-select">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@agency.com"
                    data-testid="staff-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    data-testid="staff-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                    required
                    data-testid="staff-hiredate-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="staff-submit-btn">
                    {editingStaff ? 'Update' : 'Add'} Staff
                  </Button>
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
          data-testid="staff-search-input"
        />
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No staff members found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`staff-card-${member.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{member.fullName}</h3>
                      <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {hasRole(['admin']) && (
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openEditDialog(member)}
                        data-testid={`edit-staff-btn-${member.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(member.id)}
                        data-testid={`delete-staff-btn-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {member.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4" />
                    Hired: {new Date(member.hireDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                  <Badge className={getComplianceColor(member.complianceStatus)}>
                    {member.complianceStatus === 'compliant' ? (
                      <><UserCheck className="h-3 w-3 mr-1" /> Compliant</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> {member.complianceStatus}</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPage;
