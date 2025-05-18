import React from "react";
import { AlertCircle, MapPin, Clock, Ambulance } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { label: "Active Cameras", value: "1" },
    { label: "Incidents Today", value: "0" },
    { label: "Areas Monitored", value: "1" },
    { label: "Response Time", value: "4.2m" },
  ];

  const recentIncidents = [
    {
      id: 1,
      location: "T Nagar Signal",
      time: "10:30 AM",
      type: "Major",
      status: "Response Dispatched",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-gray-500 text-sm">{stat.label}</h3>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Location</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((incident) => (
                <tr key={incident.id} className="border-b">
                  <td className="py-3">{incident.location}</td>
                  <td className="py-3">{incident.time}</td>
                  <td className="py-3">{incident.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
