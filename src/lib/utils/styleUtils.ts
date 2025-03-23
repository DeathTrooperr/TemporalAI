// Helper function to get event color
export function getEventColor(colorName: string): string {
    switch(colorName) {
        case 'blue': return '#3b82f6';
        case 'purple': return '#8b5cf6';
        case 'green': return '#10b981';
        default: return '#3b82f6'; // default color
    }
}

// Helper function for creating style strings
export function createStyleString(top: number, height: number, color: string): string {
    return `top: ${top}rem; height: ${height}rem; background-color: ${getEventColor(color)}; opacity: 0.8;`;
}