import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

const InfoSection = ({ title, icon: Icon, children, badge, badgeVariant = "default" }) => {
  return (
    <Card className="border-2 border-slate-200 overflow-hidden" data-testid={`info-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-navy font-serif">
            {Icon && <Icon className="w-5 h-5 text-gold" />}
            {title}
          </CardTitle>
          {badge && (
            <Badge 
              className={
                badgeVariant === "success" 
                  ? "bg-green-100 text-green-700" 
                  : badgeVariant === "warning"
                  ? "bg-gold-light text-gold"
                  : "bg-slate-100 text-slate-700"
              }
            >
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
};

export const InfoItem = ({ label, value, isLink = false }) => (
  <div className="py-3 border-b border-slate-100 last:border-0" data-testid={`info-item-${label.toLowerCase().replace(/\s+/g, '-')}`}>
    <dt className="text-sm font-medium text-slate-500 mb-1">{label}</dt>
    <dd className="text-navy">
      {isLink ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gold hover:underline inline-flex items-center gap-1"
        >
          Visit Link <ExternalLink className="w-4 h-4" />
        </a>
      ) : (
        value
      )}
    </dd>
  </div>
);

export const InfoList = ({ items, type = "check" }) => (
  <ul className="space-y-2">
    {items.map((item, index) => (
      <li key={index} className="flex items-start gap-2 text-slate-700">
        {type === "check" ? (
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        )}
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default InfoSection;
