import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-10 text-center">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-6xl font-extrabold mb-2 text-gray-800">404</h1>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Page Not Found</h2>

          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>

            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
