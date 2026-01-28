import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'safety', label: 'Safety' },
  { value: 'privacy', label: 'Privacy & Confidentiality' }
];

const PoliciesPage = () => {
  const { token, hasRole, user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [myAcks, setMyAcks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewPolicy, setViewPolicy] = useState(null);

  // Form state
  const [newPolicy, setNewPolicy] = useState({
    policyName: '',
    category: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    content: ''
  });

  useEffect(() => {
    fetchPolicies();
    fetchMyAcknowledgements();
  }, [categoryFilter]);

  const fetchPolicies = async () => {
    try {
      let url = `${API_URL}/api/policies`;
      if (categoryFilter && categoryFilter !== 'all') {
        url += `?category=${categoryFilter}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAcknowledgements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/my-acknowledgements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyAcks(data.map(a => a.policyId));
      }
    } catch (error) {
      console.error('Failed to load acknowledgements');
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          policyName: newPolicy.policyName,
          category: newPolicy.category,
          effectiveDate: newPolicy.effectiveDate,
          fileContent: newPolicy.content ? btoa(newPolicy.content) : null,
          fileName: newPolicy.content ? `${newPolicy.policyName}.txt` : null
        })
      });

      if (response.ok) {
        toast.success('Policy created successfully');
        setShowAddDialog(false);
        setNewPolicy({
          policyName: '',
          category: '',
          effectiveDate: new Date().toISOString().split('T')[0],
          content: ''
        });
        fetchPolicies();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create policy');
      }
    } catch (error) {
      toast.error('Failed to create policy');
    }
  };

  const handleAcknowledge = async (policyId) => {
    try {
      const response = await fetch(`${API_URL}/api/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Policy acknowledged');
        fetchMyAcknowledgements();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to acknowledge policy');
      }
    } catch (error) {
      toast.error('Failed to acknowledge policy');
    }
  };

  const handleDelete = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`${API_URL}/api/policies/${policyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Policy deleted');
        fetchPolicies();
      } else {
        toast.error('Failed to delete policy');
      }
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.policyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      administrative: 'bg-blue-100 text-blue-800',
      clinical: 'bg-green-100 text-green-800',
      hr: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800',
      privacy: 'bg-amber-100 text-amber-800'
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="policies-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policy & Procedure Vault</h1>
          <p className="text-slate-500">Manage and acknowledge organizational policies</p>
        </div>
        {hasRole(['admin']) && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-policy-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Policy</DialogTitle>
                <DialogDescription>Create a new policy document</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePolicy} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="policyName">Policy Name</Label>
                  <Input
                    id="policyName"
                    value={newPolicy.policyName}
                    onChange={(e) => setNewPolicy({...newPolicy, policyName: e.target.value})}
                    placeholder="e.g., Employee Code of Conduct"
                    required
                    data-testid="policy-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newPolicy.category} 
                      onValueChange={(value) => setNewPolicy({...newPolicy, category: value})}
                      required
                    >
                      <SelectTrigger data-testid="policy-category-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={newPolicy.effectiveDate}
                      onChange={(e) => setNewPolicy({...newPolicy, effectiveDate: e.target.value})}
                      required
                      data-testid="policy-date-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Policy Content</Label>
                  <Textarea
                    id="content"
                    value={newPolicy.content}
                    onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})}
                    placeholder="Enter policy content here..."
                    rows={8}
                    data-testid="policy-content-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="policy-submit-btn">Create Policy</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="policy-search-input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="policy-filter-select">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Policies Grid */}
      {filteredPolicies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No policies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-md transition-shadow" data-testid={`policy-card-${policy.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{policy.policyName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(policy.category)}>
                          {CATEGORIES.find(c => c.value === policy.category)?.label || policy.category}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          Version {policy.version}
                        </span>
                        <span className="text-sm text-slate-500">
                          • Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Uploaded by {policy.uploadedByName || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {myAcks.includes(policy.id) ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleAcknowledge(policy.id)}
                        data-testid={`acknowledge-btn-${policy.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    {policy.fileContent && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setViewPolicy(policy)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {hasRole(['admin']) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(policy.id)}
                        data-testid={`delete-policy-btn-${policy.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Policy Dialog */}
      <Dialog open={!!viewPolicy} onOpenChange={() => setViewPolicy(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewPolicy?.policyName}</DialogTitle>
            <DialogDescription>
              Version {viewPolicy?.version} • Effective {viewPolicy?.effectiveDate}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg text-sm">
              {viewPolicy?.fileContent ? atob(viewPolicy.fileContent) : 'No content available'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliciesPage;
