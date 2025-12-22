'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitBugReport, isAuthenticated } from '@/lib/api';
import { getDeviceInfo } from '@/lib/browserDetect';
import { Icon } from '@iconify/react';

/**
 * 📝 Bug Submission Form
 * Users can report bugs with optional screenshot
 */
export default function SubmitBugPage() {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin?redirect=/dashboard/bugs/submit');
    }
  }, [router]);
  
  // Handle screenshot upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be under 5MB');
      return;
    }
    
    setScreenshot(file);
    setError(null);
    
    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove screenshot
  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!description.trim()) {
      setError('Please describe the bug');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Get device info automatically
      const deviceInfo = getDeviceInfo();
      
      // Get current page URL
      const pageUrl = window.location.href;
      
      // Submit bug report
      const result = await submitBugReport({
        title: title.trim(),
        description: description.trim(),
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
        page_url: pageUrl,
        screenshot: screenshot || undefined,
      });
      
      // Success - redirect to bug list
      router.push(`/dashboard/bug-report/${result.bug_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit bug report');
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report a Bug
          </h1>
          <p className="text-gray-600">
            Help us improve Lyvo by reporting issues you encounter.
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Bug Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Voice cloning fails on Chrome"
              maxLength={255}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
            <p className="mt-1 text-sm text-gray-500">
              {title.length}/255 characters
            </p>
          </div>
          
          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, what you expected, and steps to reproduce the bug..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />
            <p className="mt-1 text-sm text-gray-500">
              Be as detailed as possible. Include steps to reproduce.
            </p>
          </div>
          
          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screenshot (Optional)
            </label>
            
            {!screenshotPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  disabled={submitting}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={submitting}
                >
                  <Icon icon="lets-icons:camera-duotone" width="34" height="34"  className="text-gray-500" /> Upload Screenshot
                </button>
                
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, GIF, or WebP (Max 5MB)
                </p>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg p-4">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-auto rounded"
                />
                
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                  disabled={submitting}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
          
          {/* Auto-captured Info Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📋 Technical Info (Auto-captured)
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <p>Browser: {getDeviceInfo().browser}</p>
              <p>OS: {getDeviceInfo().os}</p>
              <p>Device: {getDeviceInfo().deviceType}</p>
              <p>Page: {typeof window !== 'undefined' ? window.location.pathname : ''}</p>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Bug Report'}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}