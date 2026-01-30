import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { getCredentialingChecklist } from "../constants/stateCredentials";

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function CredentialingChecklist({ stateCode, orgType, completedItems = [], onItemToggle }) {
  const checklist = getCredentialingChecklist(stateCode, orgType);
  
  if (!checklist) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
        No credentialing checklist available for this organization type.
      </div>
    );
  }

  const totalItems = checklist.sections.reduce((sum, section) => sum + section.items.length, 0);
  const completedCount = completedItems.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-bold text-lg" style={{ color: colors.dark }}>{checklist.title}</h3>
        <p className="text-sm text-gray-600 mt-1">Reference: {checklist.reference}</p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium" style={{ color: colors.teal }}>{completedCount} of {totalItems} ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: colors.teal }}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Reference Only:</strong> This checklist is for guidance. Actual compliance must be verified with your LME/MCO and relevant licensing authorities.
        </p>
      </div>

      {/* Sections */}
      {checklist.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-semibold" style={{ color: colors.dark }}>{section.name}</h4>
          </div>
          <div className="divide-y">
            {section.items.map((item) => {
              const isCompleted = completedItems.includes(item.id);
              return (
                <label 
                  key={item.id} 
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onItemToggle?.(item.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: colors.teal }} />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1">
                    <span className={`text-sm ${isCompleted ? 'line-through text-gray-400' : ''}`} style={{ color: isCompleted ? undefined : colors.dark }}>
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="ml-2 text-xs text-red-500">Required</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
