import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuth } from '../../contexts/AuthContext';
import { teamService } from '../../services/team';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getTeamById(id as string),
  });

  const isOwner = user?._id === team?.league?.owner;

  const deleteMutation = useMutation({
    mutationFn: () => teamService.deleteTeam(id as string),
    onSuccess: () => {
      const leagueId = team?.league?._id;
      
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      if (leagueId) {
        queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); 
        queryClient.invalidateQueries({ queryKey: ['standings', leagueId] });
        queryClient.invalidateQueries({ queryKey: ['group-standings', leagueId] });
        queryClient.invalidateQueries({ queryKey: ['matches', leagueId] }); 
        queryClient.invalidateQueries({ queryKey: ['statistics', leagueId] });
      }
      
      Alert.alert('Thành công', 'Đã xóa đội', [
        { 
          text: 'OK', 
          onPress: () => router.back()
        }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa đội');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa đội "${team?.name}"? Hành động này không thể hoàn tác.`,
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

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: team?.name || 'Chi tiết đội',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => isOwner ? (
            <TouchableOpacity
              onPress={() => router.push(`/team/${id}/edit` as any)}
              style={{ padding:5,marginLeft:3}}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : null,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          {team?.logo ? (
            <Image source={{ uri: team.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.logoText, { color: colors.primary }]}>
                {team?.shortName}
              </Text>
            </View>
          )}
          
          <Text style={[styles.teamName, { color: colors.text }]}>{team?.name}</Text>
          <Text style={[styles.teamShortName, { color: colors.textSecondary }]}>
            {team?.shortName}
          </Text>
          
          {team?.group && (
            <View style={[styles.groupBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="grid-outline" size={12} color={colors.primary} />
              <Text style={[styles.groupText, { color: colors.primary }]}>
                Bảng {team.group}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Ionicons name="football-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {team?.stats?.played || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Trận đấu
            </Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Ionicons name="trophy-outline" size={20} color={colors.win} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {team?.stats?.won || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Thắng
            </Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {team?.stats?.points || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Điểm
            </Text>
          </View>
        </View>

        {team?.form && team.form.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Phong độ gần đây
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.formRow}>
                {team.form.slice(-5).map((result: 'W' | 'D' | 'L', index: number) => (
                  <View key={index} style={styles.formItem}>
                    <View style={[
                      styles.formCircle,
                      { 
                        backgroundColor: getFormColor(result, colors) + '20',
                        borderColor: getFormColor(result, colors),
                      }
                    ]}>
                      <Text style={[styles.formText, { color: getFormColor(result, colors) }]}>
                        {result}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Thống kê chi tiết
            </Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <StatsRow icon="checkmark-circle-outline" label="Thắng" value={team?.stats?.won || 0} color={colors.win} colors={colors} />
            <StatsRow icon="remove-circle-outline" label="Hòa" value={team?.stats?.drawn || 0} color={colors.draw} colors={colors} />
            <StatsRow icon="close-circle-outline" label="Thua" value={team?.stats?.lost || 0} color={colors.lose} colors={colors} />
            <StatsRow icon="arrow-up-circle-outline" label="Bàn thắng" value={team?.stats?.goalsFor || 0} color={colors.primary} colors={colors} />
            <StatsRow icon="arrow-down-circle-outline" label="Bàn thua" value={team?.stats?.goalsAgainst || 0} color={colors.textSecondary} colors={colors} />
            <StatsRow 
              icon="swap-horizontal-outline" 
              label="Hiệu số" 
              value={team?.stats?.goalDifference || 0} 
              color={team?.stats?.goalDifference && team.stats.goalDifference > 0 ? colors.win : colors.lose} 
              colors={colors}
              isLast
            />
          </View>
        </View>

        {isOwner && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.lose + '15', borderColor: colors.lose }]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Ionicons name="trash-outline" size={20} color={colors.lose} />
              <Text style={[styles.deleteButtonText, { color: colors.lose }]}>
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa đội'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.deleteWarning, { color: colors.textSecondary }]}>
              ⚠️ Hành động này không thể hoàn tác
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </>
  );
}

const StatsRow = ({ icon, label, value, color, colors, isLast }: any) => (
  <View style={[
    styles.statsRowItem,
    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }
  ]}>
    <View style={styles.statsRowLeft}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statsRowLabel, { color: colors.text }]}>{label}</Text>
    </View>
    <Text style={[styles.statsRowValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const getFormColor = (result: 'W' | 'D' | 'L', colors: any) => {
  switch (result) {
    case 'W': return colors.win;
    case 'D': return colors.draw;
    case 'L': return colors.lose;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerCard: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamShortName: {
    fontSize: 14,
    marginBottom: 12,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },

  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  formItem: {
    flex: 1,
    alignItems: 'center',
  },
  formCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formText: {
    fontSize: 16,
    fontWeight: '600',
  },

  statsRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsRowLabel: {
    fontSize: 15,
  },
  statsRowValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
