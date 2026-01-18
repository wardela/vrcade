import React, { useState, useRef, useEffect } from "react";

const Calendar = ({ selectedDate, onDateChange, maxHeight }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState("year");
    const calendarRef = useRef(null);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                onDateChange(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onDateChange]);

    const handleDateClick = (date) => {
        const correctedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        onDateChange(correctedDate);
    };

    const renderYears = () => {
        const years = [];
        const startYear = 1920;
        const currentYear = currentDate.getFullYear();

        for (let i = currentYear; i >= startYear; i--) {
            years.push(
                <div
                    key={i}
                    onClick={() => {
                        setCurrentDate(new Date(i, currentDate.getMonth(), 1));
                        setView("month");
                    }}
                    className="cursor-pointer p-2 text-base-content text-center rounded-lg hover:bg-[#58bc82] hover:text-white"
                >
                    {i}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-4 gap-2 overflow-y-auto p-3" style={{ maxHeight: `${maxHeight}px` }}>
                {years}
            </div>
        );
    };

    const renderMonths = () => {
        const months = Array.from({ length: 12 }, (_, i) =>
            new Date(0, i).toLocaleString("default", { month: "long" })
        );

        return (
            <div className="overflow-y-auto p-3" style={{ maxHeight: `${maxHeight}px` }}>
                <div
                    className="text-center text-base-content font-bold mb-2 cursor-pointer hover:text-[#58bc82]"
                    onClick={() => setView("year")}
                >
                    {currentDate.getFullYear()}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {months.map((month, i) => (
                        <div
                            key={month}
                            onClick={() => {
                                setCurrentDate(new Date(currentDate.getFullYear(), i, 1));
                                setView("day");
                            }}
                            className="cursor-pointer p-2 text-center text-base-content rounded-lg hover:bg-[#58bc82] hover:text-white"
                        >
                            {month}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const startDay = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="text-base-content"> </div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            days.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(date)}
                    className={`cursor-pointer p-2 text-center text-base-content rounded-lg ${
                        isSelected ? "bg-[#58bc82] text-white" : "hover:bg-[#58bc82] hover:text-white"
                    }`}
                >
                    {day}
                </div>
            );
        }

        return (
            <div className="overflow-y-auto p-3" style={{ maxHeight: `${maxHeight}px` }}>
                <div
                    className="text-center font-bold mb-2 text-base-content cursor-pointer hover:text-[#58bc82]"
                    onClick={() => setView("month")}
                >
                    {currentDate.toLocaleString("default", { month: "long" })}, {currentDate.getFullYear()}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div key={day} className="text-center font-bold text-[#58bc82]">
                            {day}
                        </div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div ref={calendarRef}>
            {view === "year" && renderYears()}
            {view === "month" && renderMonths()}
            {view === "day" && renderDays()}
        </div>
    );
};

export default Calendar;
