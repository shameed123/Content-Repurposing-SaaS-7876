import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { openRouterAPI, OUTPUT_FORMATS, TONE_OPTIONS } from '../lib/openrouter';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SafeIcon from '../common/SafeIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiLink, FiType, FiCopy, FiDownload, FiRefreshCw, FiZap, FiX } = FiIcons;

const RepurposePage = () => {
  const { user, userProfile } = useAuth();
  const { getRemainingCredits, canUseFeature } = useSubscription();
  const [step, setStep] = useState(1);
  const [contentInput, setContentInput] = useState({
    type: 'text', // text, url, file
    content: '',
    url: '',
    file: null
  });
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const remainingCredits = getRemainingCredits();

  // Move credit deduction to a separate effect
  const [shouldDeductCredits, setShouldDeductCredits] = useState(false);
  
  // This effect handles credit deduction when needed
  useEffect(() => {
    const deductCredits = async () => {
      if (shouldDeductCredits && user && userProfile) {
        try {
          // Update credits in database
          const newCredits = Math.max(0, userProfile.credits_remaining - 1);
          const { error } = await supabase
            .from('users')
            .update({ credits_remaining: newCredits })
            .eq('id', user.id);
            
          if (error) {
            console.error('Error deducting credits:', error);
          }
          
          // Reset flag after deduction attempt
          setShouldDeductCredits(false);
        } catch (error) {
          console.error('Error in credit deduction:', error);
          setShouldDeductCredits(false);
        }
      }
    };
    
    if (shouldDeductCredits) {
      deductCredits();
    }
  }, [shouldDeductCredits, user, userProfile]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setContentInput({
        ...contentInput,
        type: 'file',
        file: file
      });
    }
  }, [contentInput]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/vtt': ['.vtt'],
      'application/x-subrip': ['.srt']
    },
    multiple: false,
    maxSize: 10485760 // 10MB
  });

  const handleContentSubmit = async () => {
    if (!contentInput.content && !contentInput.url && !contentInput.file) {
      toast.error('Please provide some content to repurpose');
      return;
    }

    setProcessing(true);
    try {
      let processedContent = '';

      if (contentInput.type === 'text') {
        processedContent = contentInput.content;
      } else if (contentInput.type === 'url') {
        // In a real app, you'd fetch and process the URL content
        toast.info('URL processing coming soon! Please paste the content manually.');
        setProcessing(false);
        return;
      } else if (contentInput.type === 'file') {
        // In a real app, you'd process the file content
        toast.info('File processing coming soon! Please paste the content manually.');
        setProcessing(false);
        return;
      }

      // Save content item to database
      const { data, error } = await supabase
        .from('content_items')
        .insert([
          {
            user_id: user.id,
            title: `Content ${new Date().toLocaleDateString()}`,
            content_type: contentInput.type,
            original_content: processedContent,
            metadata: {}
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setStep(2);
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Error processing content');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFormat) {
      toast.error('Please select an output format');
      return;
    }

    if (remainingCredits <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    try {
      const result = await openRouterAPI.generateContent(
        contentInput.content,
        selectedFormat,
        selectedTone
      );

      setGeneratedContent(result.content);

      // Save to database
      await supabase
        .from('repurposed_content')
        .insert([
          {
            user_id: user.id,
            content_item_id: null, // You'd link this to the content item
            output_format: selectedFormat,
            tone: selectedTone,
            generated_content: result.content,
            tokens_used: result.tokensUsed,
            model_used: result.model
          }
        ]);

      // Set flag to trigger credit deduction in the effect
      setShouldDeductCredits(true);
      
      setStep(3);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Error generating content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Content copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `repurposed-content-${selectedFormat}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Content downloaded!');
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const resetForm = () => {
    setStep(1);
    setContentInput({
      type: 'text',
      content: '',
      url: '',
      file: null
    });
    setSelectedFormat('');
    setSelectedTone('professional');
    setGeneratedContent('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Repurpose Your Content
        </h1>
        <p className="text-gray-600">
          Transform your content into multiple formats with AI. 
          You have <span className="font-semibold text-primary-600">{remainingCredits} credits</span> remaining.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Content Input */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Step 1: Add Your Content
              </h2>

              {/* Content Type Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setContentInput({ ...contentInput, type: 'text' })}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    contentInput.type === 'text'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiType} className="w-4 h-4 mr-2" />
                  Paste Text
                </button>
                <button
                  onClick={() => setContentInput({ ...contentInput, type: 'url' })}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    contentInput.type === 'url'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiLink} className="w-4 h-4 mr-2" />
                  Add URL
                </button>
                <button
                  onClick={() => setContentInput({ ...contentInput, type: 'file' })}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    contentInput.type === 'file'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiUpload} className="w-4 h-4 mr-2" />
                  Upload File
                </button>
              </div>

              {/* Content Input Area */}
              {contentInput.type === 'text' && (
                <div className="space-y-4">
                  <textarea
                    value={contentInput.content}
                    onChange={(e) => setContentInput({ ...contentInput, content: e.target.value })}
                    placeholder="Paste your blog post, article, transcript, or any content you want to repurpose..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              )}

              {contentInput.type === 'url' && (
                <div className="space-y-4">
                  <Input
                    value={contentInput.url}
                    onChange={(e) => setContentInput({ ...contentInput, url: e.target.value })}
                    placeholder="https://example.com/blog-post"
                    label="Content URL"
                  />
                  <p className="text-sm text-gray-600">
                    Supported: Blog posts, YouTube videos (with transcripts), podcasts
                  </p>
                </div>
              )}

              {contentInput.type === 'file' && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {contentInput.file ? (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {contentInput.file.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(contentInput.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContentInput({ ...contentInput, file: null });
                        }}
                        className="mt-2 text-red-600 hover:text-red-700"
                      >
                        <SafeIcon icon={FiX} className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-600">
                        Supports PDF, DOCX, TXT, SRT files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleContentSubmit}
                  loading={processing}
                  disabled={!contentInput.content && !contentInput.url && !contentInput.file}
                >
                  Continue
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Format & Tone Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Step 2: Choose Format & Tone
              </h2>

              {/* Output Formats */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Output Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(OUTPUT_FORMATS).map(([key, format]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFormat(key)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedFormat === key
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{format.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                      <p className="text-xs text-gray-500">{format.maxLength}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tone & Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setSelectedTone(tone.value)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        selectedTone === tone.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{tone.label}</p>
                      <p className="text-xs text-gray-600">{tone.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!selectedFormat || remainingCredits <= 0}
                  variant="premium"
                >
                  <SafeIcon icon={FiZap} className="w-4 h-4 mr-2" />
                  Generate Content (1 credit)
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Generated Content */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Repurposed Content
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    <SafeIcon icon={FiCopy} className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Format:</span>
                    <span className="text-sm text-gray-900">
                      {OUTPUT_FORMATS[selectedFormat]?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Tone:</span>
                    <span className="text-sm text-gray-900 capitalize">{selectedTone}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900">
                    {generatedContent}
                  </pre>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  loading={loading}
                  disabled={remainingCredits <= 0}
                >
                  <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  onClick={resetForm}
                  variant="primary"
                >
                  Create Another
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RepurposePage;