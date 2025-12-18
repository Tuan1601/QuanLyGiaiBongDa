/**
 * HƯỚNG DẪN THÊM LEAGUEBACKGROUND VÀO CÁC FILE LEAGUE
 * ====================================================
 * 
 * ĐÃ HOÀN THÀNH:
 * ✅ statistics.tsx
 * ✅ teams.tsx  
 * ✅ standings.tsx
 * ✅ settings.tsx
 * ✅ matches.tsx
 * 
 * CẦN LÀM (5 files):
 * ❌ actions.tsx
 * ❌ add-team.tsx  
 * ❌ assign-groups.tsx
 * ❌ edit.tsx
 * ❌ generate-schedule.tsx
 */

// ============================================
// BƯỚC 1: THÊM IMPORT (Tất cả 5 files)
// ============================================
// Thêm dòng này sau các import khác:
import LeagueBackground from '../../../components/league/LeagueBackground';


// ============================================  
// BƯỚC 2: UPDATE RETURN STATEMENT
// ============================================

// TỪ:
return (
  <>
    <StatusBar 
      backgroundColor="rgba(214, 18, 64, 1)"
      barStyle="light-content"
    />
    <Stack.Screen
      options={{
        headerShown: true,
        headerTitle: 'Tên',
        headerStyle: { 
          backgroundColor: 'rgba(214, 18, 64, 1)',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '600',
        },
      }}
    />
    
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* content */}
    </ScrollView>
  </>
);

// THÀNH:
return (
  <>
    <StatusBar 
      backgroundColor="rgba(214, 18, 64, 1)"
      barStyle="light-content"
    />
    <Stack.Screen
      options={{
        headerShown: true,
        headerTitle: 'Tên',
        headerStyle: { 
          backgroundColor: 'rgba(214, 18, 64, 1)',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '600',
        },
      }}
    />
    
    <LeagueBackground>
      <ScrollView style={styles.container}>
        {/* content */}
      </ScrollView>
    </LeagueBackground>
  </>
);


// ============================================
// BƯỚC 3: UPDATE STYLES (Cho mỗi file)
// ============================================

// XÓA tất cả dynamic backgroundColor từ View components:
// TỪ: <View style={[styles.card, { backgroundColor: colors.card }]}>
// THÀNH: <View style={styles.card}>

// XÓA tất cả dynamic color trong styles:
// TỪ: <Text style={[styles.title, { color: colors.text }]}>
// THÀNH: <Text style={styles.title}>

// THÊM static colors vào StyleSheet:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // XÓA backgroundColor
  },
  
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',  // THÊM
    borderWidth: 1,  // THÊM
    borderColor: 'rgba(255, 255, 255, 0.15)',  // THÊM
    marginBottom: 16,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',  // THÊM
    marginBottom: 8,
  },
  
  text: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',  // THÊM
    lineHeight: 20,
  },
  
  primaryText: {
    color: '#FF9500',  // THÊM cho giá trị quan trọng
    fontWeight: '600',
  },
});


// ============================================
// CHI TIẾT CHO TỪNG FILE
// ============================================

/**
 * 1. actions.tsx
 * - Import LeagueBackground
 * - Wrap ScrollView
 * - Update styles cho: leagueInfo, statValue, statLabel, actionCard
 * - Thêm colors cho text elements
 */

/**
 * 2. add-team.tsx  
 * - Import LeagueBackground
 * - Wrap ScrollView
 * - Update styles cho: inputContainer, button
 * - Thêm glassmorphism cho form elements
 */

/**
 * 3. assign-groups.tsx
 * - Import LeagueBackground
 * - Wrap ScrollView
 * - Update styles cho: teamCard, groupButton
 * - Thêm colors cho interactive elements
 */

/**
 * 4. edit.tsx
 * - Import LeagueBackground
 * - Wrap ScrollView
 * - Update styles cho: form elements, inputs
 * - Thêm glassmorphism design
 */

/**
 * 5. generate-schedule.tsx
 * - Import LeagueBackground  
 * - Wrap ScrollView
 * - Update styles cho: infoCard, button
 * - Thêm visual improvements
 */


// ============================================
// MÀU SẮC CHO GLASSMORPHISM THEME
// ============================================
const COLORS = {
  // Background cho cards
  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  
  // Text colors
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  
  // Accent colors
  primary: '#FF9500',
  primaryLight: 'rgba(255, 149, 0, 0.15)',
  
  // Dividers
  divider: 'rgba(255, 255, 255, 0.1)',
};


// ============================================
// EXAMPLE: Hoàn chỉnh cho add-team.tsx
// ============================================

/*
// 1. Thêm import
import LeagueBackground from '../../../components/league/LeagueBackground';

// 2. Trong component, sửa return:
return (
  <>
    <StatusBar 
      backgroundColor="rgba(214, 18, 64, 1)"
      barStyle="light-content"
    />
    <Stack.Screen
      options={{
        headerShown: true,
        headerTitle: 'Thêm Đội Bóng',
        headerStyle: { 
          backgroundColor: 'rgba(214, 18, 64, 1)',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '600',
        },
      }}
    />
    
    <LeagueBackground>
      <ScrollView style={styles.container}>
        // ... rest of content
      </ScrollView>
    </LeagueBackground>
  </>
);

// 3. Update styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
*/
