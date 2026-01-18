import React, { useState, useRef, useEffect } from "react";
import Calendar from "./calendar";

const DatePicker = ({ selectedDate, onDateChange, disabled }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);
    const [availableHeight, setAvailableHeight] = useState(300); // Default height

    // Handle clicks outside the calendar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Dynamically calculate available height
    const calculateAvailableHeight = () => {
        if (calendarRef.current) {
            const rect = calendarRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom - 10;
            const spaceAbove = rect.top - 10;

            setAvailableHeight(spaceBelow > 150 ? spaceBelow : spaceAbove > 150 ? spaceAbove : 150);
        }
    };

    useEffect(() => {
        if (showCalendar) {
            calculateAvailableHeight();
            window.addEventListener("resize", calculateAvailableHeight);
        }
        return () => window.removeEventListener("resize", calculateAvailableHeight);
    }, [showCalendar]);

    return (
        <div className="relative" ref={calendarRef}>
            <button
                className={`appearance-none text-center border border-gray-600 text-base-content rounded-md py-2 w-[6rem] text-sm ${
                    disabled ? "opacity-50 cursor-not-allowed" : "bg-transparent"
                }`}
                onClick={() => {
                    if (!disabled) {
                        setShowCalendar((prev) => {
                            const newState = !prev;
                            if (newState) {
                                calculateAvailableHeight();
                            }
                            return newState;
                        });
                    }
                }}
                disabled={disabled}
            >
                {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
            </button>

            {showCalendar && !disabled && (
                <div
                    className="absolute top-full mt-2 bg-base-200 text-gray-200 p-4 rounded-lg shadow-lg z-10 overflow-y-auto"
                    style={{
                        minWidth: "300px",
                        width: "fit-content",
                        right: 0,
                        maxHeight: `${availableHeight}px`,
                    }}
                >
                    <Calendar
                        selectedDate={selectedDate}
                        onDateChange={(date) => {
                            onDateChange(date);
                            setShowCalendar(false);
                        }}
                        maxHeight={availableHeight}
                    />
                </div>
            )}
        </div>
    );
};

export default DatePicker;
