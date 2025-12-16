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

  const calculateFormPoints = (form: any): number => {
    if (!form) return 0;
    
    const formString = Array.isArray(form) ? form.join('') : String(form);
    
    return formString.split('').reduce((total, result) => {
      if (result === 'W') return total + 3;
      if (result === 'D') return total + 1;
      return total;
    }, 0);
  };

  const sortedStats = React.useMemo(() => {
    if (!stats) return null;

    return {
      ...stats,
      topScorers: stats.topScorers ? [...stats.topScorers].sort((a: any, b: any) => {
        return (b.stats?.goalsFor || 0) - (a.stats?.goalsFor || 0);
      }) : [],
      
      bestDefense: stats.bestDefense ? [...stats.bestDefense].sort((a: any, b: any) => {
        return (a.stats?.goalsAgainst || 0) - (b.stats?.goalsAgainst || 0);
      }) : [],

      bestForm: stats.bestForm ? [...stats.bestForm].sort((a: any, b: any) => {
        const aPoints = calculateFormPoints(a.form);
        const bPoints = calculateFormPoints(b.form);
        return bPoints - aPoints;
      }) : [],
    };
  }, [stats]);

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
          headerTitle: 'Thống Kê',
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
                {sortedStats?.stats?.totalTeams || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đội</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {sortedStats?.stats?.matchesPlayed || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trận đã đấu</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {sortedStats?.stats?.totalGoals || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bàn thắng</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {sortedStats?.stats?.averageGoalsPerMatch?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TB bàn/trận</Text>
            </View>
          </View>
        </View>

        {sortedStats?.topScorers && sortedStats.topScorers.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tấn công tốt nhất</Text>
            {sortedStats.topScorers.map((item: any, index: number) => (
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

        {sortedStats?.bestDefense && sortedStats.bestDefense.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phòng thủ tốt nhất</Text>
            {sortedStats.bestDefense.map((item: any, index: number) => (
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

        {sortedStats?.bestForm && sortedStats.bestForm.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phong độ tốt nhất</Text>
            {sortedStats.bestForm.map((item: any, index: number) => (
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

        {!sortedStats?.topScorers?.length && !sortedStats?.bestDefense?.length && !sortedStats?.bestForm?.length && (
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