import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Heart, Plus, ArrowRight, Search } from 'lucide-react';
// Adjust API import path to match project structure
import { getMemorialPagesByDevice, getMemorialPage } from './api';
import CreateMemorialForm from './CreateMemorialForm';
import './StartPage.css';

const StartPage = ({ onNavigateToMemorial }) => {
  const [memorialPages, setMemorialPages] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    loadMemorialPages();
  }, []);

  const loadMemorialPages = async () => {
    try {
      const response = await getMemorialPagesByDevice();
      if (response.success) {
        setMemorialPages(response.data);
        // Remove auto-redirect to create form for new users
        // Always show the main page with search option and create button
      }
    } catch (error) {
      console.error('Error loading memorial pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newPage) => {
    setMemorialPages([newPage, ...memorialPages]);
    setShowCreateForm(false);
    // Navigate to newly created page
    onNavigateToMemorial(newPage.code);
  };

  const handleViewMemorial = (code) => {
    onNavigateToMemorial(code);
  };

  const handleSearchMemorial = async () => {
    if (!searchCode.trim()) {
      setSearchError('Please enter a memorial code');
      return;
    }

    try {
      const response = await getMemorialPage(searchCode.trim());
      if (response.success) {
        onNavigateToMemorial(searchCode.trim());
      } else {
        setSearchError('Memorial page not found');
      }
    } catch (error) {
      setSearchError('Memorial page not found');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchCode(e.target.value);
    setSearchError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <CreateMemorialForm 
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
        showCancel={memorialPages.length > 0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Memorial Pages</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create meaningful memorial pages to remember precious moments and beloved ones
          </p>
        </div>

        {/* Search Memorial Code Section */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Visit Memorial Page
              </CardTitle>
              <CardDescription>
                Enter the memorial code to visit a specific memorial page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="search-code">Memorial Code</Label>
                  <Input
                    id="search-code"
                    value={searchCode}
                    onChange={handleSearchInputChange}
                    placeholder="e.g., milo22"
                    className="w-full"
                  />
                </div>
                {searchError && (
                  <p className="text-sm text-red-600">{searchError}</p>
                )}
                <Button 
                  onClick={handleSearchMemorial}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Visit Memorial Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {memorialPages.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Welcome back! 👋
              </h2>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Page
              </Button>
            </div>

            <p className="text-gray-600 mb-6">
              You have created the following memorial pages:
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memorialPages.map((page) => (
                <Card key={page.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{page.name}</span>
                      <Heart className="h-5 w-5 text-pink-500" />
                    </CardTitle>
                    <CardDescription>
                      Code: <span className="font-mono font-semibold">{page.code}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Created: {new Date(page.created_at).toLocaleDateString('en-US')}
                    </p>
                    <Button 
                      onClick={() => handleViewMemorial(page.code)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 group-hover:scale-105 transition-transform"
                    >
                      View Memorial Page
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <Heart className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No memorial pages yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first memorial page
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Memorial Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartPage;

