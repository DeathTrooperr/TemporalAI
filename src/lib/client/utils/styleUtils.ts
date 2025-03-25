// Define time periods for the day
type TimePeriod = 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'lateNight';

// Enhanced color palette with time-of-day themed colors
const colorPalette = {
	// Original colors
	blue: '#3b82f6',
	purple: '#8b5cf6',
	green: '#10b981',

	// Additional colors with temporal theme
	dawn: '#ff9e7d',       // Soft orange/pink for early morning
	sunrise: '#ff7e5f',    // Brighter orange for morning
	daylight: '#38bdf8',   // Sky blue for midday
	sunset: '#f472b6',     // Pink for evening
	dusk: '#8b5cf6',       // Purple for dusk
	midnight: '#312e81',   // Deep indigo for night

	// Seasonal colors
	spring: '#84cc16',     // Fresh green
	summer: '#eab308',     // Warm yellow
	autumn: '#ea580c',     // Orange
	winter: '#0ea5e9',     // Ice blue
};

// Helper function to determine time period based on hour
function getTimePeriod(hour: number): TimePeriod {
	if (hour >= 5 && hour < 8) return 'earlyMorning';
	if (hour >= 8 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 17) return 'afternoon';
	if (hour >= 17 && hour < 20) return 'evening';
	if (hour >= 20 && hour < 24) return 'night';
	return 'lateNight'; // 0-5 AM
}

// Get default color based on time (either provided time or current time)
function getTimeBasedColor(dateTime?: Date | string | number): string {
	let hour: number;

	if (dateTime !== undefined) {
		// Convert to Date object if string or number
		const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
		hour = date.getHours();
	} else {
		// Use current time if no time provided
		hour = new Date().getHours();
	}

	const period = getTimePeriod(hour);

	switch (period) {
		case 'earlyMorning': return colorPalette.dawn;
		case 'morning': return colorPalette.sunrise;
		case 'afternoon': return colorPalette.daylight;
		case 'evening': return colorPalette.sunset;
		case 'night': return colorPalette.dusk;
		case 'lateNight': return colorPalette.midnight;
		default: return colorPalette.blue;
	}
}

// Get seasonal color based on date (either provided date or current date)
function getSeasonalColor(dateTime?: Date | string | number): string {
	let month: number;

	if (dateTime !== undefined) {
		// Convert to Date object if string or number
		const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
		month = date.getMonth();
	} else {
		// Use current date if no date provided
		month = new Date().getMonth();
	}

	// 0-11 representing Jan-Dec
	if (month >= 2 && month <= 4) return colorPalette.spring;    // Mar-May
	if (month >= 5 && month <= 7) return colorPalette.summer;    // Jun-Aug
	if (month >= 8 && month <= 10) return colorPalette.autumn;   // Sep-Nov
	return colorPalette.winter;                                  // Dec-Feb
}

// Helper function to get event color
export function getEventColor(colorName: string, eventTime?: Date | string | number): string {
	// If it's a known color in our palette, return it
	if (colorName in colorPalette) {
		return colorPalette[colorName as keyof typeof colorPalette];
	}

	// Special dynamic colors
	if (colorName === 'timeAuto') {
		return getTimeBasedColor(eventTime);
	}

	// Season-based colors
	if (colorName === 'seasonal') {
		return getSeasonalColor(eventTime);
	}

	// Default to time-based color if not specified
	return getTimeBasedColor(eventTime);
}

// Helper function for creating style strings
export function createStyleString(top: number, height: number, color: string, eventTime?: Date | string | number): string {
	return `top: ${top}rem; height: ${height}rem; background-color: ${getEventColor(color, eventTime)}; opacity: 0.8;`;
}