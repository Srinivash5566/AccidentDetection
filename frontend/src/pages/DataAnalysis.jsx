import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const DataAnalysis = () => {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample area data - kept static as the backend doesn't provide area information
  const areaData = [
    { name: 'T Nagar', accidents: 28 },
    { name: 'Anna Nagar', accidents: 22 },
    { name: 'Velachery', accidents: 18 },
    { name: 'Adyar', accidents: 15 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch vehicle type data from the backend
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/vehicle_types/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to match the expected format
        const formattedData = data.vehicle_stats.map(item => ({
          name: formatVehicleType(item.vehicle_type),
          accidents: item.count
        }));
        
        setVehicleData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vehicle data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, []);

  // Format vehicle type for display
  const formatVehicleType = (type) => {
    // Capitalize first letter and handle specific cases
    if (!type) return "Unknown";
    
    if (type === "bike") return "Two Wheeler";
    if (type === "auto") return "Auto Rickshaw";
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get the most common vehicle type from the data
  const getMostCommonVehicle = () => {
    if (!vehicleData.length) return { name: "Loading...", count: 0 };
    
    const mostCommon = [...vehicleData].sort((a, b) => b.accidents - a.accidents)[0];
    return { name: mostCommon.name, count: mostCommon.accidents };
  };

  // Most common vehicle
  const mostCommonVehicle = getMostCommonVehicle();

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl font-medium">Loading data analysis...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Data Analysis</h1>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700">Error loading vehicle data: {error}</p>
          <p className="mt-2">Please check that your backend server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Data Analysis</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Accidents by Vehicle Type</h2>
          {vehicleData.length > 0 ? (
            <BarChart width={500} height={300} data={vehicleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accidents" fill="#0088FE" />
            </BarChart>
          ) : (
            <p className="text-gray-500 py-10 text-center">No vehicle data available</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Accidents by Area</h2>
          <PieChart width={500} height={300}>
            <Pie
              data={areaData}
              cx={250}
              cy={150}
              innerRadius={60}
              outerRadius={120}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="accidents"
              label
            >
              {areaData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Most Common Vehicle</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{mostCommonVehicle.name}</p>
              <p className="text-sm text-blue-700 mt-1">{mostCommonVehicle.count} incidents</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">High-Risk Area</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">T Nagar</p>
              <p className="text-sm text-green-700 mt-1">28 incidents</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900">Average Response Time</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">4.2 minutes</p>
              <p className="text-sm text-purple-700 mt-1">Emergency response</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataAnalysis;