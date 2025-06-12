export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getCategoryColor = (category: string): string => {
    const colors = {
        meditation: '#8DAA6D',
        sleep: '#6A8D73',
        focus: '#F6BD60',
        nature: '#5D8A66',
        anxiety: '#9E88B0',
        stress: '#BD8C61'
    };
    return colors[category as keyof typeof colors] || '#8DAA6D';
};

export const getCategoryIcon = (category: string): string => {
    const icons = {
        meditation: 'flower-outline',
        sleep: 'bed-outline',
        focus: 'radio-button-on-outline',
        nature: 'leaf-outline',
        anxiety: 'heart-outline',
        stress: 'pulse-outline'
    };
    return icons[category as keyof typeof icons] || 'musical-notes-outline';
};