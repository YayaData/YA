import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Building,
  Users,
  FileCheck,
  ClipboardList,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Category icons mapping
const CATEGORY_ICONS = {
  "Corporate & Legal": Building,
  "Workforce & Credentialing": Users,
  "Medicaid & Payer": FileCheck,
  "Clinical & Operations": ClipboardList
};

const StateEntryChecklist = ({ stateCode, stateName }) => {
  const [checklistData, setChecklistData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  // LocalStorage key for this state's checklist
  const storageKey = `state_entry_checklist_${stateCode}`;

  useEffect(() => {
    fetchChecklist();
    loadSavedProgress();
  }, [stateCode]);

  const fetchChecklist = async () => {
    try {
      const response = await axios.get(`${API}/state-entry-checklist/${stateCode}`);
      setChecklistData(response.data);
    } catch (error) {
      console.error("Error fetching checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
    }
  };

  const toggleItem = (itemId) => {
    const newChecked = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId]
    };
    setCheckedItems(newChecked);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(newChecked));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const resetProgress = () => {
    setCheckedItems({});
    localStorage.removeItem(storageKey);
  };

  const getCategoryIcon = (category) => {
    const IconComponent = CATEGORY_ICONS[category] || ClipboardList;
    return <IconComponent className="w-4 h-4" />;
  };

  // Calculate progress
  const totalItems = checklistData?.checklist_items?.length || 0;
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by category
  const itemsByCategory = checklistData?.checklist_items?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <Card className="border-2 border-slate-200 animate-pulse">
        <CardHeader className="bg-slate-50">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!checklistData) return null;

  return (
    <Card className="border-2 border-slate-200" data-testid="state-entry-checklist">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-[hsl(40,15%,96%)] border-b cursor-pointer hover:bg-[hsl(40,15%,94%)] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="font-serif text-navy text-lg flex items-center gap-2">
                    State Entry Checklist
                    <Badge variant="outline" className="text-xs font-normal">
                      <Info className="w-3 h-3 mr-1" />
                      Tracking Only
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-slate-500 font-normal">
                    {completedItems} of {totalItems} items tracked • {progressPercent}% complete
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="hidden sm:block w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-0">
            {/* Important Disclaimer */}
            <div className="bg-amber-50 border-b border-amber-100 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Important: Tracking Only</p>
                  <p className="text-amber-700">
                    {checklistData.important_notice} Verify all requirements with official state agencies. 
                    Requirements change frequently.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Items by Category */}
            <div className="divide-y divide-slate-100">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                      {getCategoryIcon(category)}
                    </div>
                    <h4 className="font-medium text-navy text-sm">{category}</h4>
                  </div>
                  <div className="space-y-3 ml-8">
                    {items.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          checkedItems[item.id] 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => toggleItem(item.id)}
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {checkedItems[item.id] ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${
                              checkedItems[item.id] ? 'text-green-800' : 'text-navy'
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.description}
                            </p>
                            {!checkedItems[item.id] && (
                              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                                <p className="mb-1"><strong>Guidance:</strong> {item.guidance}</p>
                                <p className="flex items-center gap-1 text-slate-500">
                                  <ExternalLink className="w-3 h-3" />
                                  Verify with: {item.verify_with}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Reset */}
            <div className="bg-slate-50 border-t border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Your progress is saved locally in your browser. This checklist is for personal tracking only.
                </p>
                {completedItems > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetProgress();
                    }}
                    className="text-slate-500 hover:text-red-600 text-xs"
                  >
                    Reset Progress
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default StateEntryChecklist;
