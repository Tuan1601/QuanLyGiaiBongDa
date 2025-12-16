import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          headerTitle: 'Quản lý Giải Đấu',
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
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.win }]}>{finishedMatches}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã đấu</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                {totalMatches - finishedMatches}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Còn lại</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hành động về giải đấu</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Các hành động này áp dụng cho toàn bộ giải đấu
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              resetAllMutation.isPending || totalMatches === 0 ? styles.actionCardDisabled : null
            ]}
            onPress={handleResetAll}
            disabled={resetAllMutation.isPending || totalMatches === 0}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FF9500' + '15' }]}>
              <Ionicons name="refresh" size={24} color="#FF9500" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Reset Toàn Bộ Kết Quả
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Đặt lại {totalMatches} trận về 0-0, xóa stats và media
              </Text>
              {resetAllMutation.isPending && (
                <Text style={[styles.actionStatus, { color: '#FF9500' }]}>
                  Đang xử lý...
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.card },
              (deleteScheduleMutation.isPending || totalMatches === 0 || finishedMatches > 0) ? styles.actionCardDisabled : null
            ]}
            onPress={handleDeleteSchedule}
            disabled={deleteScheduleMutation.isPending || totalMatches === 0 || finishedMatches > 0}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.lose + '15' }]}>
              <Ionicons name="trash" size={24} color={colors.lose} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Xóa Toàn Bộ Lịch Thi Đấu
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                {finishedMatches > 0
                  ? `Không khả dụng do có ${finishedMatches} trận đã hoàn thành`
                  : `Xóa vĩnh viễn ${totalMatches} trận đấu`}
              </Text>
              {deleteScheduleMutation.isPending && (
                <Text style={[styles.actionStatus, { color: colors.lose }]}>
                  Đang xử lý...
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.notice, { backgroundColor: colors.lose + '08', borderLeftColor: colors.lose }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>Lưu ý quan trọng</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Các hành động này không thể hoàn tác. Vui lòng kiểm tra kỹ trước khi thực hiện và cân nhắc backup dữ liệu quan trọng.
          </Text>
        </View>

        {totalMatches === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Chưa có lịch thi đấu
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Giải đấu chưa có trận đấu nào được tạo
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
    padding: 16,
  },
  leagueInfo: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  leagueTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  actionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  notice: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
