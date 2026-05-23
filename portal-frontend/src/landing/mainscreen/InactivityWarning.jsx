import React from "react";

const InactivityWarning = ({ secondsLeft, onStayLoggedIn }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[9999]">
      <div className="bg-base-200 rounded-lg shadow-xl p-6 w-96 text-center">
        <h2 className="text-xl font-semibold text-base-content mb-2">
          You’ve been inactive
        </h2>
        <p className="text-gray-400 mb-4">
          The app will log you out automatically in{" "}
          <span className="font-bold text-[#58bc82]">{secondsLeft}</span> seconds.
        </p>
        <div className="flex justify-around mt-4">
          <button
            onClick={onStayLoggedIn}
            className="bg-[#58bc82] text-white px-4 py-2 rounded-lg hover:bg-[#4ca873]"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;
