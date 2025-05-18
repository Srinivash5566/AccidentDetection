import React from "react";
import { NavLink } from "react-router-dom";
import { Camera, AlertTriangle, Video, BarChart2, Layout } from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { icon: Layout, text: "Dashboard", path: "/" },
    // { icon: Camera, text: "Live Footage", path: "/live-footage" },
    { icon: AlertTriangle, text: "Accident Frames", path: "/accident-frames" },
    { icon: Video, text: "Accident Videos", path: "/accident-videos" },
    { icon: BarChart2, text: "Data Analysis", path: "/data-analysis" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-8">CCTV Monitor</h1>
        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.text}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
