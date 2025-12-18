/**
 * COLOR SYNCHRONIZATION SCRIPT
 * Update all league detail pages to match [id].tsx colors
 */

// MAIN COLORS FROM [id].tsx
const LEAGUE_COLORS = {
  // Card backgrounds
  cardBg: 'rgba(70, 22, 22, 0.6)',           // Dark red transparent
  cardBorder: 'rgba(255, 255, 255, 0.15)',   // White 15%
  
  // Shadow
  shadowColor: '#4e1a1a44',                   // Dark red shadow
  
  // Text colors  
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  
  // Dividers
  divider: 'rgba(255, 255, 255, 0.15)',
  tabBorder: 'rgba(255, 255, 255, 0.2)',
  
  // Primary color
  primary: '#FF9500',  // Orange
};

// FILES TO UPDATE:
// 1. teams.tsx - ✅
// 2. standings.tsx - ✅  
// 3. matches.tsx - ✅
// 4. statistics.tsx - ✅
// 5. settings.tsx - ✅
// 6. actions.tsx - ✅
// 7. add-team.tsx - ✅
// 8. edit.tsx - ✅
// 9. assign-groups.tsx - ✅
// 10. generate-schedule.tsx - ✅

// CHANGES NEEDED:
// Replace all instances of:
// - backgroundColor: 'rgba(255, 255, 255, 0.08)' -> 'rgba(70, 22, 22, 0.6)'
// - borderColor: 'rgba(255, 255, 255, 0.15)' -> keep same
// -shadowColor: '#000' -> '#4e1a1a44'

module.exports = { LEAGUE_COLORS };
