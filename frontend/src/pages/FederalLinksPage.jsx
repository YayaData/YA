import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Globe, Building2, FileCheck, Shield, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FederalLinksPage = () => {
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${API}/federal-links`);
      setLinks(response.data.links);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    "Business Formation": { icon: Building2, items: [] },
    "Credentialing": { icon: FileCheck, items: [] },
    "Medicaid": { icon: Globe, items: [] },
    "Compliance": { icon: Shield, items: [] },
    "Behavioral Health": { icon: BookOpen, items: [] }
  };

  // Group links by category
  Object.entries(links).forEach(([key, link]) => {
    if (categories[link.category]) {
      categories[link.category].items.push({ key, ...link });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50" data-testid="federal-links-page">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-block px-4 py-2 bg-blue-light text-blue-700 rounded-full text-sm font-medium mb-6">
            Resource Library
          </span>
          <h1 className="text-4xl font-serif font-bold text-navy mb-4">
            Federal & Universal Links
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Essential federal resources and universal links for starting your peer support agency. 
            These apply regardless of which state you operate in.
          </p>
        </div>
      </section>

      {/* Links */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(categories).map(([category, { icon: Icon, items }]) => (
              items.length > 0 && (
                <Card key={category} className="border-2 border-slate-200">
                  <CardHeader className="bg-slate-50 border-b py-4">
                    <CardTitle className="font-serif text-navy flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gold" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {items.map((link) => (
                      <a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors group"
                      >
                        <ExternalLink className="w-5 h-5 text-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-medium text-navy group-hover:text-gold transition-colors">{link.name}</span>
                          <p className="text-sm text-slate-600">{link.description}</p>
                        </div>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            External links are provided for convenience. We are not responsible for third-party content or website availability.
            Always verify information directly with official agencies.
          </p>
        </div>
      </section>
    </div>
  );
};

export default FederalLinksPage;
