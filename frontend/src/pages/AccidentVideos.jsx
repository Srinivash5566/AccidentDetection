import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, MapPin, Play, X, AlertTriangle } from 'lucide-react';

const AccidentVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const modalRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    fetch('http://localhost:8000/accident_videos/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch accident videos');
        return res.json();
      })
      .then(data => {
        const formatted = data.videos.map((item, index) => {
          const [date, time] = item.timestamp.split(' ');
          // Assign a random severity for demo purposes
          const severities = ['Low', 'Medium', 'High'];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          
          return {
            id: index,
            location: item.location || 'Highway 101, Mile 23',
            date,
            time,
            severity,
            thumbnail: `http://localhost:8000/accident_frame/${item.image_path.split('/').pop()}`,
            videoUrl: `http://localhost:8000/accident_video/${item.video_path.split('/').pop()}`,
          };
        });

        setVideos(formatted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedVideo(null);
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedVideo(null);
      }
    };

    if (selectedVideo) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [selectedVideo]);
  const closeModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center text-red-600">
        <AlertTriangle size={20} className="mr-2" />
        <p className="font-medium">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Accident Videos</h1>
        <p className="text-gray-600 mb-8">Review recent traffic incidents captured by our cameras</p>

        {videos.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No accident videos found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div 
              key={video.id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]"
            >
              <div className="relative group cursor-pointer" onClick={() => setSelectedVideo(video)}>
                <img
                  src={video.thumbnail}
                  alt={video.location}
                  className="w-full h-48 object-cover transition-all duration-500 group-hover:brightness-90"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-blue-600 bg-opacity-80 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{video.location}</h3>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-500" />
                    <span>{video.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-500" />
                    <span>{video.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <span className="truncate">{video.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVideo(video)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  <Play size={16} />
                  View Recording
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            ref={modalRef}
            className="bg-white rounded-xl overflow-hidden w-full max-w-3xl shadow-2xl relative animate-scaleIn"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all z-10"
            >
              <X size={16} />
            </button>
            
            <video
              ref={videoRef}
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[70vh] bg-black"
            />
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-xl text-gray-900">{selectedVideo.location}</h2>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-500" />
                  <span>{selectedVideo.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  <span>{selectedVideo.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-gray-500" />
                  <span>{selectedVideo.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default AccidentVideos;