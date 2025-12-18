import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';

const STATUSES = [
  { value: 'scheduled', label: 'Sắp đấu', icon: '📅', description: 'Trận đấu sắp diễn ra' },
  { value: 'live', label: 'ĐANG ĐẤU', icon: '🔴', description: 'Trận đấu đang diễn ra' },
  { value: 'finished', label: 'Kết thúc', icon: '✅', description: 'Trận đấu đã kết thúc' },
  { value: 'postponed', label: 'Hoãn', icon: '⏸️', description: 'Trận đấu bị hoãn' },
  { value: 'cancelled', label: 'Hủy', icon: '❌', description: 'Trận đấu bị hủy bỏ' },
];

export default function MatchStatusScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = Colors;

  const { data: match } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatchById(id as string),
  });

  const [selectedStatus, setSelectedStatus] = useState(match?.status || 'scheduled');

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => matchService.updateMatchStatus(id as string, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['league'] });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái trận đấu', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const handleSubmit = () => {
    if (selectedStatus === match?.status) {
      Alert.alert('Thông báo', 'Trạng thái không thay đổi');
      return;
    }

    Alert.alert(
      'Xác nhận',
      `Đổi trạng thái từ "${STATUSES.find(s => s.value === match?.status)?.label}" sang "${STATUSES.find(s => s.value === selectedStatus)?.label}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: () => updateStatusMutation.mutate(selectedStatus) }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Đổi trạng thái',
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
        </View>

        <View style={styles.statusList}>
          {STATUSES.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedStatus === status.value && [styles.statusCardActive, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]
              ]}
              onPress={() => setSelectedStatus(status.value)}
            >
              <View style={styles.statusIcon}>
                <Text style={styles.statusIconText}>{status.icon}</Text>
              </View>
              <View style={styles.statusContent}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>{status.label}</Text>
                <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                  {status.description}
                </Text>
              </View>
              {selectedStatus === status.value && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            updateStatusMutation.isPending && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={updateStatusMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
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
  },
  statusList: {
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  statusCardActive: {
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusIconText: {
    fontSize: 24,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
