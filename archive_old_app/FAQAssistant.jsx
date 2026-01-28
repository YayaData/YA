import { useState } from "react";
import { 
  HelpCircle, 
  X, 
  Send, 
  Loader2,
  MessageCircle,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FAQAssistant = ({ context = "", buttonStyle = "icon" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setAnswer("");
    setHasAsked(true);
    
    try {
      const response = await axios.post(`${API}/faq-assistant`, {
        question: question.trim(),
        context: context
      });
      
      if (response.data.success) {
        setAnswer(response.data.answer);
      } else {
        setAnswer(response.data.answer || "Sorry, I couldn't process your question. Please try again.");
      }
    } catch (err) {
      console.error("FAQ error:", err);
      setAnswer("I'm having trouble right now. Please try again or browse our help pages.\n\n_This information is for educational purposes only. Always verify with official Medicaid or state guidance._");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after close animation
    setTimeout(() => {
      setQuestion("");
      setAnswer("");
      setHasAsked(false);
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Render different button styles
  const renderButton = () => {
    if (buttonStyle === "text") {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold transition-colors"
          data-testid="faq-help-btn"
        >
          <HelpCircle className="w-4 h-4" />
          Need help?
        </button>
      );
    }
    
    if (buttonStyle === "pill") {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          data-testid="faq-help-btn"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
      );
    }
    
    // Default: icon only
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-gold hover:bg-slate-100 rounded-full transition-colors"
        title="Need help?"
        data-testid="faq-help-btn"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <Card 
            className="w-full max-w-md shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            data-testid="faq-modal"
          >
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium text-navy">
                      FAQ Assistant
                    </CardTitle>
                    <p className="text-xs text-slate-500">Ask about the app</p>
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Answer area */}
              {hasAsked && (
                <div className="bg-slate-50 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-[80px]">
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {answer.split('\n').map((line, idx) => {
                        // Handle italic disclaimer
                        if (line.startsWith('_') && line.endsWith('_')) {
                          return (
                            <p key={idx} className="text-xs text-slate-500 italic mt-3 pt-2 border-t border-slate-200">
                              {line.slice(1, -1)}
                            </p>
                          );
                        }
                        return <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Question input */}
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about peer support agencies, documents, costs, or the checklist..."
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    rows={2}
                    maxLength={300}
                    disabled={loading}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!question.trim() || loading}
                    className="absolute right-2 bottom-2 p-1.5 text-gold hover:bg-gold/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {question.length}/300 characters
                </p>
              </div>

              {/* Example questions */}
              {!hasAsked && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is a peer support agency?",
                      "What documents do I need?",
                      "How much does it cost to start?",
                      "What is Step 4?"
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuestion(q)}
                        className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask another question */}
              {hasAsked && !loading && (
                <button
                  onClick={() => {
                    setQuestion("");
                    setAnswer("");
                    setHasAsked(false);
                  }}
                  className="w-full text-xs text-slate-500 hover:text-gold transition-colors"
                >
                  Ask another question
                </button>
              )}

              {/* Footer note */}
              <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                This assistant answers common questions using app content only.
                For legal or compliance questions, consult a professional.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FAQAssistant;
