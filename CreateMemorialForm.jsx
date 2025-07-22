import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Upload, X, ArrowLeft, Crown } from 'lucide-react';
// Adjust API import path to match project structure
import { createMemorialPage, uploadMedia, getPremiumStatus, subscribePremium } from './api';

const CreateMemorialForm = ({ onSuccess, onCancel, showCancel = false }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    content: '',
    is_premium: false
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'image') {
      const maxImages = isPremium || formData.is_premium ? 10 : 3;
      if (images.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} images for ${isPremium || formData.is_premium ? 'premium plan' : 'free plan'}`);
        return;
      }
      setImages(prev => [...prev, ...files]);
    } else if (type === 'video') {
      const maxVideos = isPremium || formData.is_premium ? 3 : 1;
      if (videos.length + files.length > maxVideos) {
        setError(`Maximum ${maxVideos} videos for ${isPremium || formData.is_premium ? 'premium plan' : 'free plan'}`);
        return;
      }
      
      // Check video file size
      for (const file of files) {
        if (file.size > 30 * 1024 * 1024) { // 30MB
          setError('Video file size must be under 30MB');
          return;
        }
      }
      setVideos(prev => [...prev, ...files]);
    }
    
    setError('');
  };

  const removeFile = (index, type) => {
    if (type === 'image') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setVideos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePremiumUpgrade = async () => {
    try {
      const response = await subscribePremium();
      if (response.success) {
        setFormData(prev => ({ ...prev, is_premium: true }));
        setIsPremium(true);
        setError('');
      }
    } catch (error) {
      setError('Failed to upgrade to premium');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      // Create memorial page
      const response = await createMemorialPage(formData);
      
      if (response.success) {
        const memorialPageId = response.data.id;
        
        // Upload images
        for (const image of images) {
          await uploadMedia(memorialPageId, image, 'image');
        }
        
        // Upload videos
        for (const video of videos) {
          await uploadMedia(memorialPageId, video, 'video');
        }
        
        onSuccess(response.data);
      } else {
        setError(response.message || 'Failed to create memorial page');
      }
    } catch (error) {
      setError('An error occurred while creating the memorial page');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxImages = isPremium || formData.is_premium ? 10 : 3;
  const maxVideos = isPremium || formData.is_premium ? 3 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {showCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Heart className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Create Memorial Page</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Memorial Page Information</CardTitle>
            <CardDescription>
              Fill in the information to create a meaningful memorial page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Custom Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code">Custom Code (optional)</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., milo22 (leave blank for auto-generation)"
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  This code will be printed on the product for easy access
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Name of person/pet being remembered *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Milo"
                  required
                  className="w-full"
                />
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label htmlFor="content">Memorial Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Share beautiful memories..."
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* Premium Upgrade */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Premium Plan</h3>
                        <p className="text-sm text-gray-600">$1/month - Up to 10 images + 3 videos</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handlePremiumUpgrade}
                      disabled={isPremium || formData.is_premium}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isPremium || formData.is_premium ? 'Upgraded' : 'Upgrade'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Images ({images.length}/{maxImages})</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Choose images to upload</p>
                  </label>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, 'image')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label>Videos ({videos.length}/{maxVideos})</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Choose videos to upload (max 30MB each)</p>
                  </label>
                </div>
                
                {videos.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {videos.map((video, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{video.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index, 'video')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
              >
                {loading ? 'Creating Memorial Page...' : 'Create Memorial Page'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateMemorialForm;

