// Quick batch apply LeagueBackground

const fs = require('fs');
const path = require('path');

const files = [
  'statistics.tsx',
  'edit.tsx',
  'generate-schedule.tsx',
  'assign-groups.tsx',
  'add-team.tsx',
  'actions.tsx'
];

const basePath = 't:/App Bóng Đá Phủi/MyApp/app/league/[id]/';

// Pattern: Add import, wrap ScrollView, remove backgroundColor
console.log('Apply LeagueBackground to remaining files...');
console.log(`Files: ${files.join(', ')}`);
