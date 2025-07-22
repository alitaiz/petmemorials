          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Memorial Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Title */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Heart className="h-8 w-8 text-pink-500" />
                  <h1 className="text-4xl font-bold text-gray-800">{memorial.name}</h1>
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
                
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(memorial.created_at).toLocaleDateString('en-US')}</span>
                </div>
              </div>

              {/* Content */}
              {memorial.content && (
                <div className="mb-8">
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                      {memorial.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
                    <Heart className="h-6 w-6 text-pink-500" />
                    Precious Memories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.file_path}
                          alt={`Memory ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {