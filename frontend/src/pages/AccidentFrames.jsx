import React, { useEffect, useState } from 'react';

const AccidentFrames = () => {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/accident_images/') // Update with your FastAPI URL & port
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch accident images');
        }
        return res.json();
      })
      .then(data => {
        // The backend returns { images: [{ timestamp, image_path }, ...] }
        // We map it to match your existing UI structure with dummy location/severity for now
        const formatted = data.images.map((item, index) => ({
          id: index,
          location: 'Unknown Location', // You can update this if you add location in backend
          timestamp: item.timestamp,
          severity: 'Unknown', // Or derive severity if you have that data
          images: [`http://localhost:8000/accident_frame/${item.image_path.split('/').pop()}`],
        }));

        setAccidents(formatted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-6">Loading accident frames...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Accident Frames</h1>

      {accidents.length === 0 && <p>No accident frames found.</p>}

      <div className="space-y-6">
        {accidents.map(accident => (
          <div key={accident.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                {/* <h2 className="text-xl font-semibold">{accident.location}</h2> */}
                <p className="text-gray-600">{accident.timestamp}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accident.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Accident frame ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    Frame {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccidentFrames;
