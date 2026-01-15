import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

const ProgressBar = ({ completed, total, className = "" }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`} data-testid="progress-bar">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-gold" />
          <span className="font-medium text-navy">
            {completed} of {total} steps completed
          </span>
        </div>
        <span className="font-bold text-gold">{percentage}%</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-3 bg-slate-100"
        data-testid="progress-indicator"
      />
      {percentage === 100 && (
        <p className="text-sm text-green-600 font-medium animate-fade-in">
          Congratulations! You've completed all the steps!
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
