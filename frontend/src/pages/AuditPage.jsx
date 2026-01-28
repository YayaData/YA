import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  Search,
  Filter,
  User,
  FileText,
  Users,
  AlertTriangle,
  Phone,
  Calendar,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ENTITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'policy', label: 'Policies' },
  { value: 'staff', label: 'Staff' },
  { value: 'training', label: 'Training' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'incident', label: 'Incidents' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'oncall', label: 'On-Call' },
  { value: 'user', label: 'Users' }
];

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'VIEW', label: 'View' },
  { value: 'ACKNOWLEDGE', label: 'Acknowledge' },
  { value: 'EXPORT', label: 'Export' }
];

const AuditPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [expandedLogs, setExpandedLogs] = useState({});

  // Filters
  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [entityType, action, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/audit-logs?limit=50`;
      if (entityType && entityType !== 'all') url += `&entityType=${entityType}`;
      if (action && action !== 'all') url += `&action=${action}`;
      if (startDate) url += `&startDate=${startDate}T00:00:00Z`;
      if (endDate) url += `&endDate=${endDate}T23:59:59Z`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/audit-logs/summary?days=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const toggleExpand = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-slate-100 text-slate-800',
      ACKNOWLEDGE: 'bg-purple-100 text-purple-800',
      EXPORT: 'bg-amber-100 text-amber-800'
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
  };

  const getEntityIcon = (entityType) => {
    const icons = {
      policy: FileText,
      staff: Users,
      training: Calendar,
      supervision: Clock,
      incident: AlertTriangle,
      emergency: Phone,
      oncall: Calendar,
      user: User
    };
    return icons[entityType] || FileText;
  };

  const getEntityColor = (entityType) => {
    const colors = {
      policy: 'bg-blue-100 text-blue-600',
      staff: 'bg-emerald-100 text-emerald-600',
      training: 'bg-purple-100 text-purple-600',
      supervision: 'bg-indigo-100 text-indigo-600',
      incident: 'bg-amber-100 text-amber-600',
      emergency: 'bg-red-100 text-red-600',
      oncall: 'bg-teal-100 text-teal-600',
      user: 'bg-slate-100 text-slate-600'
    };
    return colors[entityType] || 'bg-slate-100 text-slate-600';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log =>
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="audit-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500">Track all changes and activities in the system</p>
        </div>
        <Button variant="outline" onClick={() => { fetchLogs(); fetchSummary(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">{summary.totalEvents}</div>
              <p className="text-sm text-slate-500">{summary.period}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.byAction?.CREATE || 0}</div>
              <p className="text-sm text-slate-500">Records Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.byAction?.UPDATE || 0}</div>
              <p className="text-sm text-slate-500">Records Updated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summary.byAction?.DELETE || 0}</div>
              <p className="text-sm text-slate-500">Records Deleted</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="audit-search-input"
              />
            </div>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger data-testid="audit-entity-filter">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger data-testid="audit-action-filter">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              data-testid="audit-start-date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              data-testid="audit-end-date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No audit logs found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-2">
            Showing {filteredLogs.length} of {total} entries
          </div>
          {filteredLogs.map((log) => {
            const EntityIcon = getEntityIcon(log.entityType);
            const isExpanded = expandedLogs[log.id];
            const hasDetails = log.changes || log.previousValues;

            return (
              <Card key={log.id} className="hover:shadow-sm transition-shadow" data-testid={`audit-log-${log.id}`}>
                <Collapsible open={isExpanded} onOpenChange={() => hasDetails && toggleExpand(log.id)}>
                  <CollapsibleTrigger asChild>
                    <CardContent className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getEntityColor(log.entityType)}`}>
                            <EntityIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                              <span className="font-medium text-slate-900 capitalize">
                                {log.entityType}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {log.details || `${log.action} on ${log.entityType}`}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.userName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {hasDetails && (
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  {hasDetails && (
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.previousValues && Object.keys(log.previousValues).length > 0 && (
                            <div>
                              <Label className="text-xs text-slate-500 uppercase">Previous Values</Label>
                              <div className="mt-1 p-3 bg-red-50 rounded-lg">
                                {Object.entries(log.previousValues).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium text-slate-700">{key}:</span>{' '}
                                    <span className="text-red-700">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div>
                              <Label className="text-xs text-slate-500 uppercase">New Values</Label>
                              <div className="mt-1 p-3 bg-green-50 rounded-lg">
                                {Object.entries(log.changes).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium text-slate-700">{key}:</span>{' '}
                                    <span className="text-green-700">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditPage;
