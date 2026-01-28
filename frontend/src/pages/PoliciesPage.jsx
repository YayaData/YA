import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  Download,
  Trash2,
  Eye,
  Upload,
  File,
  History,
  X,
  FileType
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'safety', label: 'Safety' },
  { value: 'privacy', label: 'Privacy & Confidentiality' }
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];

const PoliciesPage = () => {
  const { token, hasRole, user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [myAcks, setMyAcks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewVersions, setViewVersions] = useState(null);
  const [versions, setVersions] = useState([]);
  const [uploadMethod, setUploadMethod] = useState('file');
  const fileInputRef = useRef(null);

  // Form state
  const [newPolicy, setNewPolicy] = useState({
    policyName: '',
    category: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    content: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const fetchVersions = async (policyId) => {
    try {
      const response = await fetch(`${API_URL}/api/policies/${policyId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      toast.error('Failed to load versions');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (uploadMethod === 'file' && selectedFile) {
        // Upload file directly
        const formData = new FormData();
        formData.append('policyName', newPolicy.policyName);
        formData.append('category', newPolicy.category);
        formData.append('effectiveDate', newPolicy.effectiveDate);
        formData.append('file', selectedFile);

        const response = await fetch(`${API_URL}/api/policies/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          toast.success('Policy uploaded successfully');
          handleCloseDialog();
          fetchPolicies();
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to upload policy');
        }
      } else {
        // Create with text content (base64 encoded)
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
            fileContent: newPolicy.content ? btoa(unescape(encodeURIComponent(newPolicy.content))) : null,
            fileName: newPolicy.content ? `${newPolicy.policyName.replace(/\s+/g, '_')}.txt` : null
          })
        });

        if (response.ok) {
          toast.success('Policy created successfully');
          handleCloseDialog();
          fetchPolicies();
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to create policy');
        }
      }
    } catch (error) {
      toast.error('Failed to create policy');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setNewPolicy({
      policyName: '',
      category: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      content: ''
    });
    setSelectedFile(null);
    setUploadMethod('file');
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

  const handleViewFile = (policy) => {
    if (policy.fileUrl) {
      // Open file in new tab for preview
      window.open(`${API_URL}${policy.fileUrl}`, '_blank');
    }
  };

  const handleDownloadFile = async (policy) => {
    if (policy.fileUrl) {
      try {
        const response = await fetch(`${API_URL}${policy.fileUrl}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = policy.fileName || `${policy.policyName}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        toast.error('Failed to download file');
      }
    }
  };

  const openVersionsDialog = (policy) => {
    setViewVersions(policy);
    fetchVersions(policy.id);
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

  const getFileIcon = (fileName) => {
    if (!fileName) return FileText;
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return FileType;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <p className="text-slate-500">Manage, upload, and acknowledge organizational policies</p>
        </div>
        {hasRole(['admin']) && (
          <Dialog open={showAddDialog} onOpenChange={(open) => open ? setShowAddDialog(true) : handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button data-testid="add-policy-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Policy</DialogTitle>
                <DialogDescription>Upload a policy document or create text content</DialogDescription>
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

                {/* Upload Method Tabs */}
                <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="text">
                      <FileText className="h-4 w-4 mr-2" />
                      Enter Text
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept={ALLOWED_EXTENSIONS.join(',')}
                        className="hidden"
                        data-testid="policy-file-input"
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <File className="h-8 w-8 text-blue-600" />
                            <div className="text-left">
                              <p className="font-medium text-slate-900">{selectedFile.name}</p>
                              <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-slate-600 mb-1">Drop file here or click to browse</p>
                          <p className="text-xs text-slate-400">
                            Allowed: {ALLOWED_EXTENSIONS.join(', ')} • Max 10MB
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="mt-3"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content">Policy Content</Label>
                      <Textarea
                        id="content"
                        value={newPolicy.content}
                        onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})}
                        placeholder="Enter policy content here..."
                        rows={10}
                        data-testid="policy-content-input"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploading || (!selectedFile && uploadMethod === 'file' && !newPolicy.content)}
                    data-testid="policy-submit-btn"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      'Create Policy'
                    )}
                  </Button>
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
          {filteredPolicies.map((policy) => {
            const FileIcon = getFileIcon(policy.fileName);
            return (
              <Card key={policy.id} className="hover:shadow-md transition-shadow" data-testid={`policy-card-${policy.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{policy.policyName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={getCategoryColor(policy.category)}>
                            {CATEGORIES.find(c => c.value === policy.category)?.label || policy.category}
                          </Badge>
                          <Badge variant="outline">
                            v{policy.version}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                          </span>
                          {policy.fileSize && (
                            <span className="text-sm text-slate-400">
                              • {formatFileSize(policy.fileSize)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Uploaded by {policy.uploadedByName || 'Admin'}
                          {policy.fileName && <span className="ml-2">• {policy.fileName}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                      {policy.fileUrl && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewFile(policy)}
                            title="Preview document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadFile(policy)}
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {policy.version > 1 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openVersionsDialog(policy)}
                          title="View version history"
                        >
                          <History className="h-4 w-4" />
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
            );
          })}
        </div>
      )}

      {/* Version History Dialog */}
      <Dialog open={!!viewVersions} onOpenChange={() => setViewVersions(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              {viewVersions?.policyName} - All versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <div 
                key={version.id}
                className={`p-4 rounded-lg border ${version.id === viewVersions?.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      {version.id === viewVersions?.id && (
                        <Badge className="bg-blue-600">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Effective: {new Date(version.effectiveDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">
                      Uploaded by {version.uploadedByName} on {new Date(version.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {version.fileUrl && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`${API_URL}${version.fileUrl}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliciesPage;
