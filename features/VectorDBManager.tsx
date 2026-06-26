import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from '../services/authService';

interface Document {
  id: number;
  filename: string;
  upload_date: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export const VectorDBManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Google Drive Integration State
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isImportingFileId, setIsImportingFileId] = useState<string | null>(null);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const loadDriveFiles = async (token: string) => {
    setIsLoadingDrive(true);
    try {
      const qQuery = encodeURIComponent(
        "mimeType = 'application/pdf' or mimeType = 'text/plain' or name contains '.md' or name contains '.txt' or mimeType = 'text/markdown'"
      );
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qQuery}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=40`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load files from Google Drive');
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(`Drive Error: ${err.message}`);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setNeedsAuth(false);
        loadDriveFiles(currentToken);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign in failed:', err);
      setError(`Google Authentication failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setNeedsAuth(true);
      setDriveFiles([]);
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain' && !file.name.endsWith('.md')) {
      setError('Please upload a PDF, TXT, or MD file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(50);
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      setUploadProgress(100);
      await fetchDocuments();
      e.target.value = '';
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleImportDriveFile = async (fileId: string, fileName: string, mimeType: string) => {
    setIsImportingFileId(fileId);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication token expired or unavailable. Please sign in again.');

      // 1. Fetch file content from Google Drive
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to download "${fileName}" from Google Drive.`);

      const blob = await res.blob();
      const fileObj = new File([blob], fileName, { type: mimeType });

      // 2. Upload file to back-end vector db parser
      const formData = new FormData();
      formData.append('file', fileObj);

      const uploadRes = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to process file on vector DB server');
      }

      // Refresh list
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsImportingFileId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const docToDelete = documents.find(d => d.id === id);
    const docName = docToDelete ? docToDelete.filename : 'this document';
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${docName}" from the Vector DB?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete document');
      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return 'Unknown size';
    const bytes = parseInt(bytesStr);
    if (isNaN(bytes)) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDriveFiles = driveFiles.filter(file => 
    file.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              <i className="fa-solid fa-database"></i>
            </div>
            <div>
              <h2 className="text-4xl font-black text-[#004E9A] uppercase tracking-tighter">Knowledge Base Manager</h2>
              <p className="text-slate-500 font-medium">Upload PDF/Text or Sync with Google Drive to create NotebookLM intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {!needsAuth && user ? (
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 leading-tight">{user.displayName || 'Google Drive File Owner'}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-red-500 hover:text-red-700 font-bold ml-2 transition-colors uppercase tracking-wider"
                  title="Disconnect account"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm transition-all duration-200 text-slate-700 font-bold text-xs"
              >
                <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/logo_googleg_24dp.svg" alt="Google" className="w-4 h-4" referrerPolicy="no-referrer" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Manual Local Upload Column */}
          <div className="flex flex-col h-full bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-700 tracking-wider uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-laptop text-indigo-500"></i> Local File Ingestion
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-normal">
              Select or drop campaign documents straight from your local device storage. Supports PDF, plain TXT, or markdown (MD).
            </p>
            <label className="relative flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl bg-white hover:bg-indigo-50/10 transition-colors cursor-pointer group p-6 min-h-[160px]">
              <div className="flex flex-col items-center justify-center text-center">
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 group-hover:scale-110 transition-transform mb-2"></i>
                <p className="text-xs text-slate-600 font-bold"><span className="text-indigo-600 font-black">Browse files</span> or drop here</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PDF, TXT, MD</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} disabled={isUploading} />
              
              {isUploading && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center z-20 p-4">
                  <i className="fa-solid fa-circle-notch animate-spin text-3xl text-indigo-600 mb-3"></i>
                  <p className="text-indigo-800 font-black uppercase tracking-widest text-[10px] mb-2 text-center">Analyzing & Generating Embeddings...</p>
                  <div className="w-36 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Google Drive Ingestion Column */}
          <div className="flex flex-col h-full bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-700 tracking-wider uppercase mb-3 flex items-center gap-2">
              <i className="fa-brands fa-google-drive text-[#0F9D58]"></i> Google Drive Sync
            </h3>
            
            {needsAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-slate-200 rounded-2xl bg-white p-6 min-h-[160px]">
                <i className="fa-brands fa-google-drive text-4xl text-[#0F9D58] mb-3 opacity-60"></i>
                <p className="text-xs font-bold text-slate-600 mb-3">Connect your Google Workspace Account to index files</p>
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-bold text-xs"
                >
                  <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/logo_googleg_24dp.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" referrerPolicy="no-referrer" />
                  <span>Connect Google Drive</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden min-h-[160px] h-[190px]">
                {/* Drive Searching bar */}
                <div className="flex items-center border-b border-slate-100 px-3 py-1.5 bg-slate-50">
                  <i className="fa-solid fa-magnifying-glass text-xs text-slate-400 mr-2"></i>
                  <input 
                    type="text" 
                    placeholder="Search drive files..." 
                    value={driveSearchQuery}
                    onChange={e => setDriveSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400 py-1"
                  />
                  {driveSearchQuery && (
                    <button onClick={() => setDriveSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  )}
                </div>

                {/* Drive Files listed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {isLoadingDrive ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
                      <i className="fa-solid fa-spinner animate-spin text-lg text-indigo-500 mb-2"></i>
                      <span>Loading documents...</span>
                    </div>
                  ) : filteredDriveFiles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 text-center p-4">
                      <i className="fa-solid fa-file-excel text-lg text-slate-300 mb-2"></i>
                      <span>No PDF, TXT or MD files found in the account.</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredDriveFiles.map(file => {
                        const isImporting = isImportingFileId === file.id;
                        const isPdf = file.mimeType === 'application/pdf';
                        return (
                          <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100/80 transition-colors text-xs border border-transparent hover:border-slate-200/50">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <i className={`fa-solid ${isPdf ? 'fa-file-pdf text-red-500' : 'fa-file-lines text-indigo-500'} shrink-0 text-sm`}></i>
                              <div className="truncate">
                                <p className="font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-slate-400 leading-none mt-0.5">{formatBytes(file.size)}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleImportDriveFile(file.id, file.name, file.mimeType)}
                              disabled={isImporting || isImportingFileId !== null}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                                isImporting 
                                ? 'bg-indigo-100 text-indigo-600 cursor-not-allowed'
                                : isImportingFileId !== null
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              {isImporting ? (
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-spinner animate-spin"></i> Ingesting
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-cloud-arrow-down"></i> Sync
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List of Indexed Files */}
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list-ul text-indigo-500"></i> Indexed Toolkit Documents
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-3"></i>
              <p className="text-slate-500 font-medium">No documents in the vector database yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
                return (
                  <div key={doc.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${isPdf ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-indigo-50 text-indigo-500 border border-indigo-100'} rounded-xl flex items-center justify-center shrink-0`}>
                        <i className={`fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'} text-lg`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 truncate" title={doc.filename}>{doc.filename}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Loaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Delete from database"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
