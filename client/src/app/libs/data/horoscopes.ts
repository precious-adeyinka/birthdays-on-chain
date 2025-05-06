// Mapping of horoscopes to month names
export const horoscopeToString = {
    "Aries": "March",
    "Taurus": "April", 
    "Gemini": "May",
    "Cancer": "June",
    "Leo": "July",
    "Virgo": "August",
    "Libra": "September",
    "Scorpio": "October",
    "Sagittarius": "November",
    "Capricorn": "December",
    "Aquarius": "January",
    "Pisces": "February"
};

// Mapping of horoscopes to month numbers (for JavaScript Date object)
// Note: JavaScript months are zero-indexed (0-11)
export const horoscopeToMonthNumber = {
    "Aries": 2,        // March
    "Taurus": 3,       // April
    "Gemini": 4,       // May
    "Cancer": 5,       // June
    "Leo": 6,          // July
    "Virgo": 7,        // August
    "Libra": 8,        // September
    "Scorpio": 9,      // October
    "Sagittarius": 10, // November
    "Capricorn": 11,   // December
    "Aquarius": 0,     // January
    "Pisces": 1        // February
};

// Date ranges for each horoscope (start and end dates)
export const horoscopeDateRanges = {
    "Aries": { start: { month: 2, day: 21 }, end: { month: 3, day: 19 } },
    "Taurus": { start: { month: 3, day: 20 }, end: { month: 4, day: 20 } },
    "Gemini": { start: { month: 4, day: 21 }, end: { month: 5, day: 20 } },
    "Cancer": { start: { month: 5, day: 21 }, end: { month: 6, day: 22 } },
    "Leo": { start: { month: 6, day: 23 }, end: { month: 7, day: 22 } },
    "Virgo": { start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    "Libra": { start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    "Scorpio": { start: { month: 9, day: 23 }, end: { month: 10, day: 21 } },
    "Sagittarius": { start: { month: 10, day: 22 }, end: { month: 11, day: 21 } },
    "Capricorn": { start: { month: 11, day: 22 }, end: { month: 0, day: 19 } },
    "Aquarius": { start: { month: 0, day: 20 }, end: { month: 1, day: 18 } },
    "Pisces": { start: { month: 1, day: 19 }, end: { month: 2, day: 20 } }
};

// Utility function to get horoscope from a date
export function getHoroscopeFromDate(date: Date) {
    const month = date.getMonth();
    const day = date.getDate();

    for (const [horoscope, range] of Object.entries(horoscopeDateRanges)) {
        // Handle cases that cross year boundary (like Capricorn)
        const isWithinRange = 
            (range.start.month <= range.end.month && 
                month === range.start.month && day >= range.start.day) ||
            (range.start.month <= range.end.month && 
                month === range.end.month && day <= range.end.day) ||
            (range.start.month > range.end.month && 
                ((month === range.start.month && day >= range.start.day) || 
                (month === range.end.month && day <= range.end.day)));

        if (isWithinRange) return horoscope;
    }

    return null; // If no horoscope matches
}

// // Example usage
// const today = new Date();
// console.log(getHoroscopeFromDate(today)); // Prints current horoscope