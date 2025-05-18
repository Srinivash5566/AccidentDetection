import React, { useState } from 'react';

const LiveFootage = () => {
  const [selectedArea, setSelectedArea] = useState('all');

  const areas = [
    { id: 'all', name: 'All Areas' },
    { id: 'tnagar', name: 'T Nagar' },
    { id: 'annanagar', name: 'Anna Nagar' },
  ];

  // Simulated camera feeds
  const cameras = [
    { id: 1, name: 'T Nagar Signal 1', area: 'tnagar', url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f' },
    { id: 2, name: 'T Nagar Market', area: 'tnagar', url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d' },
    { id: 3, name: 'Anna Nagar Round', area: 'annanagar', url: 'https://images.unsplash.com/photo-1564495584622-0bb3af6f668e' },
    { id: 4, name: 'Anna Nagar West', area: 'annanagar', url: 'https://images.unsplash.com/photo-1579118786996-11a414435c6d' },
  ];

  const filteredCameras = selectedArea === 'all' 
    ? cameras 
    : cameras.filter(camera => camera.area === selectedArea);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Live Footage</h1>
        <div className="flex space-x-4">
          {areas.map(area => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-4 py-2 rounded-lg ${
                selectedArea === area.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCameras.map(camera => (
          <div key={camera.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={camera.url}
              alt={camera.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold">{camera.name}</h3>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveFootage