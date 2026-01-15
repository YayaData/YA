import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MapPin, FileText, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home", icon: MapPin },
    { path: "/national-overview", label: "National Overview", icon: Globe },
    { path: "/templates", label: "Templates", icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-nav border-b border-slate-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
            data-testid="navbar-logo"
          >
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg font-serif">PS</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-navy text-lg">Peer Support</span>
              <span className="block text-xs text-slate-500 -mt-1">Agency Launch</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-gold active"
                    : "text-slate-600 hover:text-navy"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-gold text-gold hover:bg-gold hover:text-white"
                  data-testid="upgrade-dropdown-trigger"
                >
                  Upgrade
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="upgrade-dropdown-menu">
                <DropdownMenuItem data-testid="upgrade-pdf">
                  Download Full PDF Guide
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="upgrade-templates">
                  Get Editable Templates
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="upgrade-consultation">
                  Book a Consultation
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="upgrade-course">
                  Access Full Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-navy"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 mobile-menu-enter" data-testid="mobile-menu">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? "bg-gold-light text-gold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 px-4">
                <Button 
                  className="w-full bg-gold hover:bg-gold/90 text-white"
                  data-testid="mobile-upgrade-button"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
