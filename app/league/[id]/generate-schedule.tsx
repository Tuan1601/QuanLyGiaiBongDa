import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { leagueService } from '../../../services/league';
import { matchService } from '../../../services/match';
import { teamService } from '../../../services/team';
import LeagueBackground from '../../../components/league/LeagueBackground';

export default function GenerateScheduleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = Colors;

  const { data: league } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamService.getTeamsByLeague(id as string),
  });

  const generateMutation = useMutation({
    mutationFn: () => matchService.generateSchedule(id as string),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      Alert.alert(
        'Thành công',
        `Đã tạo ${data.totalMatches} trận đấu trong ${data.totalRounds} vòng`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo lịch');
    },
  });

  const calculateMatches = () => {
    const n = teams?.teams?.length || 0;
    if (league?.type === 'round-robin') {
      return n * (n - 1) / 2;
    }
    const teamsPerGroup = league?.groupSettings?.teamsPerGroup || 0;
    const numberOfGroups = league?.groupSettings?.numberOfGroups || 0;
    return numberOfGroups * (teamsPerGroup * (teamsPerGroup - 1) / 2);
  };

  const handleGenerate = () => {
    const teamsCount = teams?.teams?.length || 0;
    const requiredTeams = league?.numberOfTeams || 0;

    if (teamsCount < requiredTeams) {
      Alert.alert(
        'Chưa đủ đội',
        `Cần ${requiredTeams} đội, hiện có ${teamsCount} đội`
      );
      return;
    }

    if (league?.type === 'group-stage') {
      const hasUnassigned = teams?.teams?.some((team: any) => !team.group);
      if (hasUnassigned) {
        Alert.alert('Lỗi', 'Cần phân bảng cho tất cả đội trước');
        return;
      }
    }

    Alert.alert(
      'Xác nhận',
      `Tạo lịch thi đấu sẽ tạo ${calculateMatches()} trận đấu. Tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tạo lịch', onPress: () => generateMutation.mutate() }
      ]
    );
  };

  const totalMatches = calculateMatches();
  const canGenerate = (teams?.teams?.length || 0) >= (league?.numberOfTeams || 0);

  return (
    <>
      <StatusBar 
        backgroundColor="rgba(214, 18, 64, 1)"
        barStyle="light-content"
      />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Tạo Lịch Thi Đấu',
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
          <View style={styles.previewCard}>
            <Text style={styles.cardTitle}>Xem trước</Text>
            <View style={styles.previewRows}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Thể thức</Text>
                <Text style={styles.previewValue}>
                  {league?.type === 'round-robin' ? 'Vòng tròn 1 lượt' : 'Chia bảng'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Số đội</Text>
                <Text style={styles.previewValue}>
                  {teams?.teams?.length}/{league?.numberOfTeams}
                </Text>
              </View>
              <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.previewLabel}>Tổng số trận</Text>
                <Text style={[styles.previewValue, styles.highlight]}>
                  {totalMatches}
                </Text>
              </View>
            </View>

            {!canGenerate && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  Cần đủ {league?.numberOfTeams} đội để tạo lịch thi đấu
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Lưu ý</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Lịch thi đấu sẽ được tạo tự động
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Mỗi đội sẽ gặp tất cả các đội khác 1 lần
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Bạn có thể cập nhật ngày giờ và địa điểm sau
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.bullet} />
                <Text style={styles.infoText}>
                  Không thể tạo lại lịch khi đã có trận đấu
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              !canGenerate && styles.buttonDisabled
            ]}
            onPress={handleGenerate}
            disabled={!canGenerate || generateMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {generateMutation.isPending ? 'Đang tạo...' : 'Tạo lịch thi đấu'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LeagueBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(70, 22, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#4e1a1a44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.2,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  previewRows: {
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  highlight: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9500',
  },
  warning: {
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    backgroundColor: 'rgba(255, 165, 0, 0.12)',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#FFA500',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.2,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: '#FF9500',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    ...Platform.select({
      ios: {
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});