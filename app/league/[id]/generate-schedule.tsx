import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { leagueService } from '../../../services/league';
import { matchService } from '../../../services/match';
import { teamService } from '../../../services/team';

export default function GenerateScheduleScreen() {
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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Tạo lịch thi đấu',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.preview, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Xem trước</Text>
          <View style={styles.previewCard}>
            <View style={[styles.previewRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Thể thức:</Text>
              <Text style={[styles.previewValue, { color: colors.text }]}>
                {league?.type === 'round-robin' ? 'Vòng tròn 1 lượt' : 'Chia bảng'}
              </Text>
            </View>
            <View style={[styles.previewRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Số đội:</Text>
              <Text style={[styles.previewValue, { color: colors.text }]}>
                {teams?.teams?.length}/{league?.numberOfTeams}
              </Text>
            </View>
            <View style={[styles.previewRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Tổng số trận:</Text>
              <Text style={[styles.previewValue, styles.highlight, { color: colors.primary }]}>
                {totalMatches}
              </Text>
            </View>
          </View>

          {!canGenerate && (
            <View style={[styles.warning, { backgroundColor: colors.draw + '20' }]}>
              <Text style={[styles.warningText, { color: colors.draw }]}>
                ⚠️ Cần đủ {league?.numberOfTeams} đội để tạo lịch
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Lưu ý</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Lịch thi đấu sẽ được tạo tự động{'\n'}
            • Mỗi đội sẽ gặp tất cả các đội khác 1 lần{'\n'}
            • Bạn có thể cập nhật ngày giờ và địa điểm sau{'\n'}
            • Không thể tạo lại lịch khi đã có trận đấu
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  preview: {
    marginBottom: 30,
    borderRadius: 12,
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewCard: {
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewLabel: {
    fontSize: 15,
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  highlight: {
    fontSize: 18,
  },
  warning: {
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
  },
  info: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});