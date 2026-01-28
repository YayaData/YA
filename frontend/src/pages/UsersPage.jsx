import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCog, 
  Search,
  Shield,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROLES = [
  { value: 'staff', label: 'Staff', description: 'Read-only access to policies, can submit reports' },
  { value: 'qp', label: 'Qualified Professional', description: 'Access to supervision logs and view incidents' },
  { value: 'admin', label: 'Administrator', description: 'Full access to all features' }
];

const UsersPage = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}/role?role=${newRole}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('User role updated');
        setEditingUser(null);
        setNewRole('');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      qp: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return Shield;
    if (role === 'qp') return UserCog;
    return User;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500">Manage user accounts and roles</p>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
          <CardDescription>Understanding user roles and access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {ROLES.map(role => {
              const Icon = getRoleIcon(role.value);
              return (
                <div key={role.value} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${getRoleColor(role.value)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{role.label}</span>
                  </div>
                  <p className="text-sm text-slate-500">{role.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="users-search-input"
        />
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            const isCurrentUser = user.id === currentUser?.id;
            
            return (
              <Card 
                key={user.id} 
                className={`hover:shadow-md transition-shadow ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
                data-testid={`user-card-${user.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getRoleColor(user.role)}`}>
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {user.fullName}
                          {isCurrentUser && <span className="text-xs text-blue-600 ml-2">(You)</span>}
                        </h3>
                        <Badge className={getRoleColor(user.role)}>
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    {user.createdAt && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {!isCurrentUser && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => openEditDialog(user)}
                      data-testid={`edit-user-btn-${user.id}`}
                    >
                      Change Role
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Badge className={getRoleColor(editingUser?.role)}>
                {ROLES.find(r => r.value === editingUser?.role)?.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={newRole === editingUser?.role}
                data-testid="update-role-btn"
              >
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
