import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { useToast } from '../../../hooks/useToast';
import { leagueService } from '../../../services/league';
import { matchService } from '../../../services/match';

export default function LeagueActionsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const toast = useToast();

  const { data: leagueData } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const { data: matchesData } = useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchService.getMatchesByLeague(id as string),
  });

  const league = leagueData?.league;
  const matches = matchesData?.matches || [];
  const finishedMatches = matches.filter((m: any) => m.status === 'finished').length;
  const totalMatches = matches.length;

  const resetAllMutation = useMutation({
    mutationFn: () => matchService.resetAllMatches(id as string),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: ['standings', id] });
      queryClient.invalidateQueries({ queryKey: ['group-standings', id] });
      queryClient.invalidateQueries({ queryKey: ['statistics', id] });
      queryClient.invalidateQueries({ queryKey: ['league', id] });
      toast.showSuccess(
        'Thành công',
        `Đã reset ${data.totalMatchesReset || 0} trận đấu. Stats của tất cả đội đã về 0.`
      );
    },
    onError: (error: any) => {
      toast.showError('Lỗi', error.response?.data?.message || 'Không thể reset kết quả');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: () => matchService.deleteSchedule(id as string),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: ['league', id] });
      toast.showSuccess(
        'Thành công',
        `Đã xóa ${data.deletedMatches || 0} trận đấu.`
      );
      setTimeout(() => router.back(), 500);
    },
    onError: (error: any) => {
      toast.showError('Lỗi', error.response?.data?.message || 'Không thể xóa lịch thi đấu');
    },
  });

  const handleResetAll = () => {
    Alert.alert(
      'Xác nhận Reset Toàn Bộ',
      `Reset tất cả ${totalMatches} trận đấu?\n\n` +
      '⚠️ Các thay đổi:\n' +
      `• Reset ${totalMatches} trận về 0-0\n` +
      '• Reset stats của TẤT CẢ đội về 0\n' +
      '• Xóa form của tất cả đội\n' +
      '• Xóa tất cả videos & ảnh\n' +
      '• Trạng thái về "scheduled"\n\n' +
      'Hành động này KHÔNG THỂ hoàn tác!',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Reset Tất Cả',
          style: 'destructive',
          onPress: () => resetAllMutation.mutate()
        }
      ]
    );
  };

  const handleDeleteSchedule = () => {
    if (finishedMatches > 0) {
      Alert.alert(
        'Không thể xóa',
        `Không thể xóa lịch thi đấu vì đã có ${finishedMatches} trận có kết quả.\n\nVui lòng "Reset Toàn Bộ Kết Quả" trước.`
      );
      return;
    }

    Alert.alert(
      'Xác nhận Xóa Lịch Thi Đấu',
      `Xóa toàn bộ ${totalMatches} trận đấu?\n\n` +
      '⚠️ Hành động này sẽ:\n' +
      `• Xóa vĩnh viễn ${totalMatches} trận đấu\n` +
      '• KHÔNG được reset các stats\n' +
      '• Giải đấu sẽ không còn lịch thi đấu\n\n' +
      'Bạn có thể tạo lịch mới sau khi xóa.\n\n' +
      'KHÔNG THỂ HOÀN TÁC!',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa Lịch',
          style: 'destructive',
          onPress: () => deleteScheduleMutation.mutate()
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Hành động Giải Đấu',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.leagueInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.leagueTitle, { color: colors.text }]}>{league?.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalMatches}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng trận</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.win }]}>{finishedMatches}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã đấu</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                {totalMatches - finishedMatches}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Còn lại</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Hành động nguy hiểm</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Các hành động này áp dụng cho TOÀN BỘ giải đấu. Hãy cẩn thận!
          </Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: '#FF9500' }]}
            onPress={handleResetAll}
            disabled={resetAllMutation.isPending || totalMatches === 0}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9500' + '20' }]}>
              <Ionicons name="refresh" size={32} color="#FF9500" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Reset Toàn Bộ Kết Quả
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Reset {totalMatches} trận về 0-0, xóa tất cả stats, form, media
              </Text>
              {resetAllMutation.isPending && (
                <Text style={[styles.actionProcessing, { color: '#FF9500' }]}>
                  Đang reset...
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.lose },
              finishedMatches > 0 && styles.actionCardDisabled
            ]}
            onPress={handleDeleteSchedule}
            disabled={deleteScheduleMutation.isPending || totalMatches === 0 || finishedMatches > 0}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.lose + '20' }]}>
              <Ionicons name="trash" size={32} color={colors.lose} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Xóa Toàn Bộ Lịch Thi Đấu
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                {finishedMatches > 0
                  ? `Không thể xóa (có ${finishedMatches} trận đã đấu). Reset trước!`
                  : `Xóa vĩnh viễn ${totalMatches} trận, không thể hoàn tác`}
              </Text>
              {deleteScheduleMutation.isPending && (
                <Text style={[styles.actionProcessing, { color: colors.lose }]}>
                  Đang xóa...
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.warning, { backgroundColor: colors.lose + '10', borderColor: colors.lose }]}>
          <Ionicons name="warning" size={28} color={colors.lose} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>Cảnh báo quan trọng</Text>
            <Text style={[styles.warningText, { color: colors.text }]}>
              • Các hành động này áp dụng cho TOÀN BỘ giải đấu{'\n'}
              • Không thể hoàn tác sau khi thực hiện{'\n'}
              • Hãy suy nghĩ kỹ trước khi tiếp tục{'\n'}
              • Nên backup dữ liệu quan trọng trước
            </Text>
          </View>
        </View>

        {totalMatches === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có lịch thi đấu
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  leagueInfo: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  leagueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 15,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionProcessing: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  warning: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
});
