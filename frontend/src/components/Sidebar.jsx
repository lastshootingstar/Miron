import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ collapsed, toggleCollapse }) => {
  return (
    <div
      className={`flex flex-col justify-between bg-gray-800 p-6 w-48 h-full transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-48"
      }`} // Reduced width from w-64 to w-48
    >
      {/* Sidebar Content */}
      <div>
        {/* Logo or Title */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-2xl text-white ${collapsed ? "hidden" : ""}`}>
            Dashboard
          </h1>
          <button onClick={toggleCollapse} className="text-white">
            {collapsed ? ">" : "<"}
          </button>
        </div>

        {/* Links */}
        <ul>
          <li>
            <Link
              to="/"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/dalee"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              Dalee
            </Link>
          </li>
          <li>
            <Link
              to="/picot"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              PICOT
            </Link>
          </li>
          <li>
            <Link
              to="/results"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              Results
            </Link>
          </li>
          <li>
            <Link
              to="/systematic-review"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              Systematic Review
            </Link>
          </li>
          <li>
            <Link
              to="/byt"
              className="text-white block py-2 px-4 rounded-lg hover:bg-teal-600"
            >
              BYT Analyzer
            </Link>
          </li>
        </ul>
      </div>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login"; // Redirect to login page
          }}
          className="text-white bg-red-600 w-full py-2 rounded-lg hover:bg-red-500 mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
