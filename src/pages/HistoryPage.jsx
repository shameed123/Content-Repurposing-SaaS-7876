import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OUTPUT_FORMATS } from '../lib/openrouter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SafeIcon from '../common/SafeIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiFileText, FiCopy, FiDownload, FiSearch, FiFilter, FiCalendar, FiTrash2, FiEye, FiX } = FiIcons;

const HistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, filterFormat]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('repurposed_content')
        .select(`
          *,
          content_items(title, content_type, original_content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading history');
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.content_items?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.output_format.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.generated_content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterFormat !== 'all') {
      filtered = filtered.filter(item => item.output_format === filterFormat);
    }

    setFilteredHistory(filtered);
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard!');
  };

  const handleDownload = (item) => {
    const element = document.createElement('a');
    const file = new Blob([item.generated_content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.output_format}-${new Date(item.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Content downloaded!');
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('repurposed_content')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory(history.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error deleting item');
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content History</h1>
        <p className="text-gray-600">View and manage all your repurposed content</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content..."
              className="pl-10"
            />
          </div>

          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Formats</option>
            {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
              <option key={key} value={key}>{format.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={FiCalendar} className="w-4 h-4" />
            <span>{filteredHistory.length} items found</span>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiFileText} className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {OUTPUT_FORMATS[item.output_format]?.name || item.output_format}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.content_items?.title || 'Untitled'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiEye} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(item.generated_content)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiCopy} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiDownload} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {item.generated_content.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="capitalize">{item.tone}</span>
                    <span>{item.tokens_used} tokens</span>
                  </div>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <SafeIcon icon={FiFileText} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterFormat !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start by repurposing your first piece of content'
            }
          </p>
          <Button onClick={() => window.location.href = '/#/repurpose'}>
            Create Content
          </Button>
        </Card>
      )}

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {OUTPUT_FORMATS[selectedItem.output_format]?.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Created on {new Date(selectedItem.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <SafeIcon icon={FiX} className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Format:</span>
                    <span className="ml-2 text-gray-900">
                      {OUTPUT_FORMATS[selectedItem.output_format]?.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tone:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedItem.tone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tokens Used:</span>
                    <span className="ml-2 text-gray-900">{selectedItem.tokens_used}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Model:</span>
                    <span className="ml-2 text-gray-900">{selectedItem.model_used}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-sans text-gray-900 text-sm">
                  {selectedItem.generated_content}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedItem.generated_content)}
              >
                <SafeIcon icon={FiCopy} className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload(selectedItem)}
              >
                <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={closeModal}>Close</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;