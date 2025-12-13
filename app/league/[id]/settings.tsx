import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { leagueService } from '@/services/league';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function LeagueSettingsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: league } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const [isPrivate, setIsPrivate] = useState(league?.visibility === 'private');

  const visibilityMutation = useMutation({
    mutationFn: (visibility: 'public' | 'private') =>
      leagueService.updateVisibility(id as string, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', id] });
      Alert.alert('Thành công', 'Đã cập nhật chế độ hiển thị');
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: () => leagueService.generateToken(id as string),
    onSuccess: (data) => {
      Alert.alert(
        'Mã truy cập mới',
        `Mã: ${data.accessToken}\n\nChia sẻ mã này để người khác có thể xem giải đấu.`
      );
      queryClient.invalidateQueries({ queryKey: ['league', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leagueService.deleteLeague(id as string),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã xóa giải đấu', [
        { text: 'OK', onPress: () => router.replace('/my-leagues' as any) }
      ]);
    },
  });

  const handleVisibilityToggle = (value: boolean) => {
    setIsPrivate(value);
    visibilityMutation.mutate(value ? 'private' : 'public');
  };

  const handleGenerateToken = () => {
    Alert.alert(
      'Tạo mã mới',
      'Mã cũ sẽ không còn hiệu lực. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tạo mới', onPress: () => generateTokenMutation.mutate() }
      ]
    );
  };

  const handleDelete = () => {
    if (league?.tournamentStatus === 'completed') {
      Alert.alert('Lỗi', 'Không thể xóa giải đấu đã kết thúc');
      return;
    }

    Alert.alert(
      'Xóa giải đấu',
      'Bạn có chắc chắn muốn xóa giải đấu này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Cài đặt giải đấu',
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { borderBottomColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chế độ hiển thị</Text>
          
          <View style={styles.setting}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Giải đấu riêng tư</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary || colors.icon }]}>
                Chỉ người có mã truy cập mới xem được
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handleVisibilityToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {isPrivate && league?.accessToken && (
            <View style={[styles.tokenCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.tokenLabel, { color: colors.textSecondary || colors.icon }]}>
                Mã truy cập hiện tại:
              </Text>
              <Text style={[styles.tokenValue, { color: colors.text }]}>
                {league.accessToken}
              </Text>
              <TouchableOpacity
                style={[styles.tokenButton, { borderColor: colors.primary }]}
                onPress={handleGenerateToken}>
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={[styles.tokenButtonText, { color: colors.primary }]}>Tạo mã mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.section, { borderBottomColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quản lý nội dung</Text>
          
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/league/${id}/edit` as any)}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Chỉnh sửa thông tin</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary || colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/league/${id}/teams` as any)}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Quản lý đội bóng</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary || colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/league/${id}/matches` as any)}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Quản lý trận đấu</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary || colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.lose }]}>Vùng nguy hiểm</Text>
          
          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={colors.lose} />
            <Text style={[styles.menuText, { color: colors.lose }]}>Xóa giải đấu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
  },
  tokenCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
  },
  tokenLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  tokenButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
});