import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { leagueService } from '../../../services/league';
import { teamService } from '../../../services/team';

export default function AssignGroupsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: league } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamService.getTeamsByLeague(id as string),
  });

  const assignMutation = useMutation({
    mutationFn: () => teamService.assignGroups(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: ['league', id] }); 
      queryClient.invalidateQueries({ queryKey: ['group-standings', id] }); 
      Alert.alert('Thành công', 'Đã phân bảng tự động', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể phân bảng');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => teamService.resetGroups(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: ['league', id] }); 
      queryClient.invalidateQueries({ queryKey: ['group-standings', id] }); 
      Alert.alert('Thành công', 'Đã reset phân bảng');
    },
  });

  const handleAssign = () => {
    const teamsCount = teams?.teams?.length || 0;
    const requiredTeams = league?.numberOfTeams || 0;

    if (teamsCount < requiredTeams) {
      Alert.alert(
        'Chưa đủ đội',
        `Cần ${requiredTeams} đội, hiện có ${teamsCount} đội`
      );
      return;
    }

    Alert.alert(
      'Xác nhận',
      'Phân bảng tự động sẽ chia đều các đội vào các bảng. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Phân bảng', onPress: () => assignMutation.mutate() }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Xác nhận',
      'Reset phân bảng sẽ xóa tất cả phân bổ hiện tại. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetMutation.mutate() }
      ]
    );
  };

  const teamsCount = teams?.teams?.length || 0;
  const requiredTeams = league?.numberOfTeams || 0;
  const canAssign = teamsCount >= requiredTeams;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Phân Bảng Tự Động',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Thông tin cấu hình</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {league?.groupSettings?.numberOfGroups}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Số bảng</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {league?.groupSettings?.teamsPerGroup}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Đội/bảng</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {requiredTeams}
              </Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tổng cần</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Số đội hiện có:</Text>
            <Text style={[
              styles.statusValue,
              { color: canAssign ? colors.win : colors.lose }
            ]}>
              {teamsCount} / {requiredTeams}
            </Text>
          </View>
          
          {!canAssign && (
            <View style={[styles.warning, { backgroundColor: colors.draw + '10', borderLeftColor: colors.draw }]}>
              <Text style={[styles.warningText, { color: colors.draw }]}>
                Cần thêm {requiredTeams - teamsCount} đội để có thể phân bảng
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>Cách thức phân bảng</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Các đội sẽ được phân đều vào {league?.groupSettings?.numberOfGroups} bảng
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Mỗi bảng có {league?.groupSettings?.teamsPerGroup} đội
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Phân bổ ngẫu nhiên đảm bảo công bằng
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.primary },
              !canAssign && styles.buttonDisabled
            ]}
            onPress={handleAssign}
            disabled={!canAssign || assignMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {assignMutation.isPending ? 'Đang xử lý...' : 'Phân bảng tự động'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSecondary,
              { borderColor: colors.lose }
            ]}
            onPress={handleReset}
            disabled={resetMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonSecondaryText, { color: colors.lose }]}>
              {resetMutation.isPending ? 'Đang xử lý...' : 'Reset phân bảng'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  warning: {
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    borderLeftWidth: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    paddingBottom: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});