import { useState, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { getRequiredDocuments } from "../constants/stateCredentials";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const colors = {
  blue: "#1F4FD8",
  teal: "#1CB5A3",
  gold: "#F4B400",
  dark: "#1F2937"
};

export default function DocumentUpload({ stateCode, orgType, uploadedDocuments = [], onUpload, onRemove, organizationName = '' }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState({});
  const fileInputRef = useRef(null);
  
  const requiredDocuments = getRequiredDocuments(stateCode, orgType);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], docId);
    }
  };

  const handleFile = async (file, docId) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPEG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Set uploading state
    setUploading(prev => ({ ...prev, [docId]: true }));

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organization_name', organizationName || 'Unknown Organization');
      formData.append('document_type', requiredDocuments.find(d => d.id === docId)?.name || docId);
      formData.append('document_id', docId);

      // Upload to backend
      const response = await axios.post(`${API}/credentials/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Call onUpload with the response data
      onUpload?.(docId, {
        id: docId,
        fileId: response.data.file_id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      });

      toast.success(`Document uploaded: ${file.name}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleFileSelect = (e, docId) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], docId);
    }
  };

  const getDocumentStatus = (docId) => {
    return uploadedDocuments.find(d => d.id === docId);
  };

  const uploadedCount = requiredDocuments.filter(doc => getDocumentStatus(doc.id)).length;
  const requiredCount = requiredDocuments.filter(doc => doc.required).length;
  const requiredUploadedCount = requiredDocuments.filter(doc => doc.required && getDocumentStatus(doc.id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-bold text-lg" style={{ color: colors.dark }}>Required Documents</h3>
        <p className="text-sm text-gray-600 mt-1">Upload documentation to support your credentialing application.</p>
        
        {/* Progress */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" style={{ color: colors.teal }} />
            <span className="text-sm">
              <strong>{requiredUploadedCount}</strong> of <strong>{requiredCount}</strong> required
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{uploadedCount} total uploaded</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Self-Reported:</strong> Documents are self-reported and not verified automatically. Your LME/MCO may request additional verification.
        </p>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {requiredDocuments.map((doc) => {
          const uploaded = getDocumentStatus(doc.id);
          
          return (
            <div 
              key={doc.id}
              className={`border rounded-xl overflow-hidden ${uploaded ? 'border-green-200 bg-green-50/50' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium" style={{ color: colors.dark }}>{doc.name}</h4>
                      {doc.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                  </div>
                  
                  {uploaded && (
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0" style={{ color: colors.teal }} />
                  )}
                </div>

                {/* Upload Area or Uploaded File */}
                {uploaded ? (
                  <div className="mt-4 flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: colors.dark }}>{uploaded.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded {new Date(uploaded.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onRemove?.(doc.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : uploading[doc.id] ? (
                  <div className="mt-4 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                    <Loader2 className="h-8 w-8 mx-auto text-blue-500 mb-2 animate-spin" />
                    <p className="text-sm text-blue-600">Uploading document...</p>
                  </div>
                ) : (
                  <div
                    className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={(e) => handleDrop(e, doc.id)}
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag & drop your file here, or
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(e, doc.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png';
                        input.onchange = (e) => handleFileSelect(e, doc.id);
                        input.click();
                      }}
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">PDF, JPEG, or PNG (max 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
