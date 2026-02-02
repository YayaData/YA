import { Link } from "react-router-dom";
import { MapPin, FileText, Globe, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-navy font-bold text-lg font-serif">PS</span>
              </div>
              <div>
                <span className="font-serif font-bold text-white text-lg">Peer Support</span>
                <span className="block text-xs text-slate-400 -mt-1">Agency Launch™</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md mb-4">
              A guidance and documentation framework for launching Peer Support agencies. 
              Expand state-by-state with structure, templates, and tracking tools.
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@peersupportlaunch.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1-800-PSS-HELP</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/" 
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  data-testid="footer-link-home"
                >
                  <MapPin className="w-4 h-4" />
                  State Guide
                </Link>
              </li>
              <li>
                <Link 
                  to="/national-overview" 
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  data-testid="footer-link-overview"
                >
                  <Globe className="w-4 h-4" />
                  National Overview
                </Link>
              </li>
              <li>
                <Link 
                  to="/templates" 
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  data-testid="footer-link-templates"
                >
                  <FileText className="w-4 h-4" />
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <span className="cursor-pointer hover:text-white transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-white transition-colors">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-white transition-colors">
                  Disclaimer
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <div className="warning-box bg-slate-800 border-l-gold p-4 rounded-r-lg mb-6">
            <p className="text-sm text-slate-300">
              <strong className="text-gold">Important:</strong> This platform provides educational and organizational tools. 
              Peer Support is regulated at the state level — requirements vary by jurisdiction. 
              Approval and reimbursement are determined by state authorities and Medicaid agencies, not this platform.
            </p>
          </div>
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Peer Support Agency Launch™. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
