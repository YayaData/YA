import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MapPin, FileText, Globe, ChevronDown, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ConsultationModal from "@/components/ConsultationModal";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home", icon: MapPin },
    { path: "/national-overview", label: "National Overview", icon: Globe },
    { path: "/federal-links", label: "Federal Links", icon: Globe },
    { path: "/templates", label: "Templates", icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  const handleCheckout = async (productId) => {
    setCheckoutLoading(productId);
    try {
      const response = await axios.post(`${API}/checkout/create-session`, {
        product_id: productId,
        origin_url: window.location.origin
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[hsla(40,20%,98%,0.95)] backdrop-blur-md border-b border-[hsl(40,15%,88%)]" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
              data-testid="navbar-logo"
            >
              <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
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

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost"
                onClick={() => setConsultationOpen(true)}
                className="text-navy hover:text-gold"
                data-testid="nav-consultation-btn"
              >
                Book Consultation
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="bg-gold hover:bg-gold/90 text-white"
                    data-testid="upgrade-dropdown-trigger"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" data-testid="upgrade-dropdown-menu">
                  <DropdownMenuItem 
                    onClick={() => handleCheckout("pdf-guide")}
                    disabled={checkoutLoading === "pdf-guide"}
                    data-testid="upgrade-pdf"
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <span>Full PDF Guide</span>
                      <span className="text-gold font-medium">$47</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleCheckout("templates-bundle")}
                    disabled={checkoutLoading === "templates-bundle"}
                    data-testid="upgrade-templates"
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <span>Templates Bundle</span>
                      <span className="text-gold font-medium">$97</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleCheckout("state-bundle")}
                    disabled={checkoutLoading === "state-bundle"}
                    data-testid="upgrade-state-bundle"
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <span>5-State Bundle</span>
                      <span className="text-gold font-medium">$147</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleCheckout("consultation")}
                    disabled={checkoutLoading === "consultation"}
                    data-testid="upgrade-consultation"
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <span>Strategy Call</span>
                      <span className="text-gold font-medium">$197</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleCheckout("full-course")}
                    disabled={checkoutLoading === "full-course"}
                    data-testid="upgrade-course"
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <span>Full Course</span>
                      <span className="text-gold font-medium">$297</span>
                    </div>
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
                <div className="mt-4 px-4 space-y-3">
                  <Button 
                    variant="outline"
                    className="w-full border-navy text-navy"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setConsultationOpen(true);
                    }}
                    data-testid="mobile-consultation-button"
                  >
                    Book Consultation
                  </Button>
                  <Button 
                    className="w-full bg-gold hover:bg-gold/90 text-white"
                    onClick={() => handleCheckout("pdf-guide")}
                    data-testid="mobile-upgrade-button"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Get Full Guide - $47
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />
    </>
  );
};

export default Navbar;
