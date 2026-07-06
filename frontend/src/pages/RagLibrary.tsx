import React, { useState } from 'react';
import api from '../services/api';
import { Upload, Search, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SearchResult {
  filename: string;
  content: string;
  similarity: number;
}

const RagLibrary: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/rag/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(response.data.message || 'Document parsed and indexed successfully!');
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to index document. Verify the file is PDF or TXT.');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');
    try {
      const response = await api.post('/rag/search', {
        query: searchQuery,
        limit: 3
      });
      setSearchResults(response.data);
      if (response.data.length === 0) {
        setSuccess('Search completed. No matches found. Try uploading relevant guides.');
      }
    } catch (err: any) {
      setError('Search query failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">RAG Reference Library</h1>
        <p className="text-sm text-gray-400">
          Upload books, company interview guides, or study notes. The RAG engine generates local embeddings to execute context searches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md h-fit">
          <h3 className="text-sm font-bold text-white mb-4">Add Study Guides</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <label className="border-2 border-dashed border-gray-850 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-950/20 group">
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-purple-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-gray-300">
                {file ? file.name : 'Choose a file'}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">PDF or TXT formats (Max 8MB)</span>
              <input 
                type="file" 
                accept=".pdf,.txt" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{uploading ? 'Parsing vector chunks...' : 'Index Document'}</span>
            </button>
          </form>
        </div>

        {/* Semantic search section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Search reference guides (e.g. What is CAP Theorem?)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800 focus:border-purple-500/60 text-white placeholder-gray-600 text-xs focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {searching ? 'Querying...' : 'Search'}
            </button>
          </form>

          {/* Results list */}
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-white flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>{res.filename}</span>
                    </span>
                    <span className="bg-purple-950 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded font-black font-mono">
                      Match: {Math.round(res.similarity * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap bg-gray-950/20 p-3 rounded-lg border border-gray-850">
                    {res.content}
                  </p>
                </div>
              ))
            ) : (
              !searching && (
                <div className="flex flex-col items-center justify-center text-center p-12 glass-effect rounded-2xl h-60">
                  <Search className="w-10 h-10 text-gray-600 mb-2" />
                  <h3 className="text-xs font-bold text-white">Ask reference questions</h3>
                  <p className="text-[10px] text-gray-500 max-w-xs mt-1.5">
                    Query topics to scan your RAG library for matching semantic explanations.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RagLibrary;
