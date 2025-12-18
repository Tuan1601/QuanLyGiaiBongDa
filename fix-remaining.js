// Fix Colors usage in all remaining app files
const fs = require('fs');

const files = [
  't:/App Bóng Đá Phủi/MyApp/app/match/[id].tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/actions.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/edit-info.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/status.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/update-result.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/upload-media.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/upload-photos.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/match/[id]/upload-videos.tsx',
  't:/App Bóng Đá Phủi/MyApp/app/team/[id].tsx',
  't:/App Bóng Đá Phủi/MyApp/app/team/[id]/edit.tsx',
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the pattern
    content = content.replace(
      /const colorScheme = useColorScheme\(\) \?\? 'light';\s*const colors = Colors\[colorScheme\];/g,
      'const colors = Colors;'
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file.split('/').pop()}`);
  } catch (error) {
    console.log(`❌ Error fixing ${file.split('/').pop()}:`, error.message);
  }
});

console.log('\n🎉 All app files fixed! Theme is now consistent.');
