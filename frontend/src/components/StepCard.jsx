import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const StepCard = ({ step, title, description, completed = false, onToggle }) => {
  return (
    <Card 
      className={`
        card-hover border-2 transition-all duration-200
        ${completed ? "border-green-500 bg-green-50/50" : "border-slate-200"}
      `}
      data-testid={`step-card-${step}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Step Number / Check */}
          <button
            onClick={onToggle}
            className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-200 focus-ring
              ${
                completed
                  ? "bg-green-500 text-white"
                  : "bg-gold-light text-gold hover:bg-gold hover:text-white"
              }
            `}
            data-testid={`step-toggle-${step}`}
          >
            {completed ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <span className="font-bold text-lg">{step}</span>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 
              className={`
                font-serif font-bold text-lg mb-2
                ${completed ? "text-green-700 line-through" : "text-navy"}
              `}
            >
              {title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex-shrink-0 hidden sm:block">
            {completed ? (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Done
              </span>
            ) : (
              <ArrowRight className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepCard;
