'use client'

import React from 'react';

const EnvDebug = () => {
  const checkEnv = () => {
    console.log('Environment Variables Status:', {
      googleApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY,
      edamamAppId: !!process.env.NEXT_PUBLIC_EDAMAM_APP_ID,
      edamamAppKey: !!process.env.NEXT_PUBLIC_EDAMAM_APP_KEY
    });
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <button
        onClick={checkEnv}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Check Environment Variables
      </button>
    </div>
  );
};

export default EnvDebug;
