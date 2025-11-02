// Deterministic color selection based on name
export function getAvatarColor(name: string): string {
  const colors = [
    'hsl(221, 83%, 53%)',  // Blue
    'hsl(142, 71%, 45%)',  // Green
    'hsl(262, 52%, 47%)',  // Purple
    'hsl(24, 91%, 58%)',   // Orange
    'hsl(199, 89%, 48%)',  // Cyan
    'hsl(340, 82%, 52%)',  // Pink
  ];
  
  // Simple hash function based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
