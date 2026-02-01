import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Anchor, BookOpen, FileText, Users, Video, ArrowRight } from "lucide-react";

export default function Resources() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 bg-sky-600 rounded-xl">
            <Anchor className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Resources</span>
        </div>
      </header>

      <main className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Resources & Guides
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Templates, step-by-step guides, and support to help you launch or grow your placement services.
            </p>
          </div>

          {/* Resource Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Provider Startup Guide</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Step-by-step instructions for becoming a licensed provider in your state.
                </p>
                <span className="text-sm text-sky-600 font-medium">Coming Soon</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Agency Setup Templates</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Forms, checklists, and templates for starting a placement coordination agency.
                </p>
                <span className="text-sm text-sky-600 font-medium">Coming Soon</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Training Videos</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Video tutorials on using Anchor Place effectively for your organization.
                </p>
                <span className="text-sm text-sky-600 font-medium">Coming Soon</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance Checklist</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Essential compliance considerations for placement coordination.
                </p>
                <span className="text-sm text-sky-600 font-medium">Coming Soon</span>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Want to be notified when resources are available?
            </h2>
            <p className="text-sky-100 mb-6">
              We're building out our resource library. Get notified when new guides are published.
            </p>
            <Button 
              onClick={() => navigate("/onboarding")}
              className="h-12 px-6 font-semibold rounded-xl bg-white hover:bg-slate-100 gap-2"
              style={{ color: '#1F4FD8' }}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
