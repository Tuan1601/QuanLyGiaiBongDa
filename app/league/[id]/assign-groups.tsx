import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      queryClient.invalidateQueries({ queryKey: ['league', id] }); // Update league detail
      queryClient.invalidateQueries({ queryKey: ['group-standings', id] }); // Update group standings
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
      queryClient.invalidateQueries({ queryKey: ['league', id] }); // Update league detail
      queryClient.invalidateQueries({ queryKey: ['group-standings', id] }); // Update group standings
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
          headerTitle: 'Phân bảng tự động',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.info, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Thông tin phân bảng</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Số bảng:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {league?.groupSettings?.numberOfGroups}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Đội/bảng:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {league?.groupSettings?.teamsPerGroup}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tổng số đội cần:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {requiredTeams}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Số đội hiện có:</Text>
            <Text style={[
              styles.infoValue,
              { color: canAssign ? colors.text : colors.lose }
            ]}>
              {teamsCount}
            </Text>
          </View>

          {!canAssign && (
            <View style={[styles.warning, { backgroundColor: colors.draw + '20' }]}>
              <Text style={[styles.warningText, { color: colors.draw }]}>
                ⚠️ Cần thêm {requiredTeams - teamsCount} đội nữa để phân bảng
              </Text>
            </View>
          )}
        </View>

        <View style={styles.instructions}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>Cách thức phân bảng</Text>
          <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
            • Các đội sẽ được phân đều vào các bảng{'\n'}
            • Mỗi bảng có {league?.groupSettings?.teamsPerGroup} đội{'\n'}
            • Phân bổ ngẫu nhiên để đảm bảo công bằng
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            !canAssign && styles.buttonDisabled
          ]}
          onPress={handleAssign}
          disabled={!canAssign || assignMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {assignMutation.isPending ? 'Đang phân bảng...' : 'Phân bảng tự động'}
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
        >
          <Text style={[styles.buttonTextSecondary, { color: colors.lose }]}>
            {resetMutation.isPending ? 'Đang reset...' : 'Reset phân bảng'}
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
  info: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
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
  instructions: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});