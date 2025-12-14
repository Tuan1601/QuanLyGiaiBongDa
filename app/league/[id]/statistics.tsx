import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import TopTeamCard from '../../../components/stats/TopTeamCard';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { standingsService } from '../../../services/standings';

export default function StatisticsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: stats, isLoading } = useQuery({
    queryKey: ['leagueStats', id],
    queryFn: () => standingsService.getLeagueStats(id as string),
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Thống kê',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Thống kê',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { borderBottomColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.stats?.totalTeams || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đội</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.stats?.matchesPlayed || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trận đã đấu</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.stats?.totalGoals || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bàn thắng</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.stats?.averageGoalsPerMatch?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TB bàn/trận</Text>
            </View>
          </View>
        </View>

        {stats?.topScorers && stats.topScorers.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Tấn công tốt nhất</Text>
            {stats.topScorers.map((item: any, index: number) => (
              <TopTeamCard
                key={item.team._id}
                position={index + 1}
                team={item.team}
                value={item.stats?.goalsFor || 0}
                label="bàn thắng"
                color={colors.win}
              />
            ))}
          </View>
        )}

        {stats?.bestDefense && stats.bestDefense.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🛡️ Phòng thủ tốt nhất</Text>
            {stats.bestDefense.map((item: any, index: number) => (
              <TopTeamCard
                key={item.team._id}
                position={index + 1}
                team={item.team}
                value={item.stats?.goalsAgainst || 0}
                label="bàn thua"
                color={colors.secondary}
              />
            ))}
          </View>
        )}

        {stats?.bestForm && stats.bestForm.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📈 Phong độ tốt nhất</Text>
            {stats.bestForm.map((item: any, index: number) => (
              <TopTeamCard
                key={item.team._id}
                position={index + 1}
                team={item.team}
                form={item.form}
                color={colors.win}
              />
            ))}
          </View>
        )}

        {!stats?.topScorers?.length && !stats?.bestDefense?.length && !stats?.bestForm?.length && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có dữ liệu thống kê
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
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  empty: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});