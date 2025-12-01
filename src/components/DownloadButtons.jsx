import React from 'react';

const DownloadButtons = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full p-4">
            {/* Windows Button */}
            <a
                href="/downloads/TM Lockated Setup.exe"
                className="flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-blue-700 hover:scale-105 shadow-lg w-full md:w-auto group"
                aria-label="Download for Windows"
                download
            >
                <svg
                    viewBox="0 0 88 88"
                    fill="currentColor"
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203L0 12.402zm35.67 33.529l.028 34.253L.028 75.029l-.028-29.08 35.67-.018zm4.323-39.26l47.98-6.645v39.95l-47.98.243v-33.548zm47.95 37.352v40.132l-47.948-6.764v-33.28l47.948-.088z" />
                </svg>
                <span className="font-semibold text-lg">Download for Windows (.exe)</span>
            </a>

            {/* Mac Button */}
            <a
                href="/downloads/TM Lockated.dmg"
                className="flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-gray-900 hover:scale-105 shadow-lg w-full md:w-auto group"
                aria-label="Download for Mac"
                download
            >
                <svg
                    viewBox="0 0 384 512"
                    fill="currentColor"
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                </svg>
                <span className="font-semibold text-lg">Download for Mac (.dmg)</span>
            </a>
        </div>
    );
};

export default DownloadButtons;
