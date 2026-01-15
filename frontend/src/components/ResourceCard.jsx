import { FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ResourceCard = ({ title, description, category, previewText, downloadUrl }) => {
  const handleDownload = () => {
    toast.success(`Downloading: ${title}`, {
      description: "Your template will download shortly.",
    });
    // In production, this would trigger actual download
    window.open(downloadUrl, "_blank");
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Operations: "bg-blue-light text-blue-700",
      Hiring: "bg-green-100 text-green-700",
      Contracts: "bg-purple-100 text-purple-700",
      Communications: "bg-orange-100 text-orange-700",
      Finance: "bg-gold-light text-gold",
    };
    return colors[cat] || "bg-slate-100 text-slate-700";
  };

  return (
    <Card 
      className="template-card card-hover border-2 border-slate-200 overflow-hidden"
      data-testid={`resource-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Icon Section */}
          <div className="flex-shrink-0 p-6 bg-slate-50 flex items-center justify-center sm:w-24">
            <FileText className="w-10 h-10 text-gold" />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-serif font-bold text-navy text-lg">{title}</h3>
                <Badge className={`mt-1 ${getCategoryColor(category)}`}>
                  {category}
                </Badge>
              </div>
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-gold hover:bg-gold/90 text-white"
                data-testid={`download-btn-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <p className="text-slate-600 text-sm mb-3">{description}</p>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                Preview
              </p>
              <p className="text-sm text-slate-600 italic line-clamp-3">
                {previewText}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
