import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';

export default function MatchActionsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: match } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatchById(id as string),
  });

  const resetMutation = useMutation({
    mutationFn: () => matchService.resetMatch(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['group-standings'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['league'] });
      Alert.alert('Thành công', 'Đã reset kết quả trận đấu. Stats của các đội đã được reset.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể reset trận đấu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => matchService.deleteMatch(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['league'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['group-standings'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      Alert.alert('Thành công', 'Đã xóa trận đấu', [
        { text: 'OK', onPress: () => router.replace(`/league/${match?.league}` as any) }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa trận đấu');
    },
  });

  const handleReset = () => {
    Alert.alert(
      'Xác nhận Reset',
      'Reset kết quả trận đấu này? Các thay đổi:\n\n' +
      '• Tỷ số về 0-0\n' +
      '• Trạng thái về "scheduled"\n' +
      '• Stats của 2 đội được điều chỉnh\n' +
      '• Form được cập nhật\n' +
      '• Xóa video & ảnh',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetMutation.mutate()
        }
      ]
    );
  };

  const handleDelete = () => {
    if (match?.status === 'finished') {
      Alert.alert(
        'Không thể xóa',
        'Không thể xóa trận đấu đã có kết quả. Vui lòng reset kết quả trước.'
      );
      return;
    }

    Alert.alert(
      'Xác nhận Xóa',
      `Xóa trận đấu "${match?.homeTeam.name} vs ${match?.awayTeam.name}"? Hành động này không thể hoàn tác!`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Hành động',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.matchInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Trận đấu</Text>
          <Text style={[styles.matchText, { color: colors.text }]}>
            {match?.homeTeam.name} vs {match?.awayTeam.name}
          </Text>
          <Text style={[styles.roundText, { color: colors.textSecondary }]}>Vòng {match?.round}</Text>
          {match?.status && (
            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>
                {match.status === 'finished' ? 'Kết thúc' :
                 match.status === 'live' ? 'LIVE' :
                 match.status === 'scheduled' ? 'Sắp đấu' :
                 match.status}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Hành động nguy hiểm</Text>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: '#FF9500' }]}
            onPress={handleReset}
            disabled={resetMutation.isPending}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9500' + '20' }]}>
              <Ionicons name="refresh" size={28} color="#FF9500" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Reset kết quả</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Xóa kết quả, stats về 0, xóa media
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.lose }]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending || match?.status === 'finished'}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.lose + '20' }]}>
              <Ionicons name="trash" size={28} color={colors.lose} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Xóa trận đấu</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                {match?.status === 'finished' 
                  ? 'Không thể xóa trận đã có kết quả'
                  : 'Xóa vĩnh viễn, không thể hoàn tác'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.warning, { backgroundColor: '#FF9500' + '10', borderColor: '#FF9500' }]}>
          <Ionicons name="warning" size={24} color="#FF9500" />
          <Text style={[styles.warningText, { color: colors.text }]}>
            Các hành động này không thể hoàn tác. Hãy cẩn thận khi thực hiện.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  matchInfo: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  matchText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  roundText: {
    fontSize: 14,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  warning: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
