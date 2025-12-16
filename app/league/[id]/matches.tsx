import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MatchCard from '../../../components/match/MatchCard';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';

export default function MatchesListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: allMatchesData } = useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchService.getMatchesByLeague(id as string),
    staleTime: 30000, 
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['matches', id, selectedRound, selectedStatus],
    queryFn: () => matchService.getMatchesByLeague(id as string, undefined, {
      round: selectedRound || undefined,
      status: selectedStatus || undefined,
    }),
    retry: (failureCount, error: any) => {
      if (error.message?.includes('timeout') && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const rounds = useMemo(() => {
    if (!allMatchesData?.matches) return [];
    return [...new Set(allMatchesData.matches.map((m: any) => m.round))].sort((a: any, b: any) => a - b);
  }, [allMatchesData]);

  const statuses = [
    { value: 'scheduled', label: 'Sắp đấu' },
    { value: 'live', label: 'Đang đấu' },
    { value: 'finished', label: 'Đã đấu' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Lịch thi đấu',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/league/${id}/standings` as any)}
              style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="podium-outline" size={20} style={{marginLeft:15}} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600'}}>BXH</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {rounds.length > 0 && (
          <View style={[styles.filters, { borderBottomColor: colors.border }]}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Vòng đấu:</Text>
            <FlatList
              horizontal
              data={[
                { value: null, label: 'Tất cả' },
                ...rounds.map(r => ({ value: r, label: `Vòng ${r}` }))
              ]}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { borderColor: colors.border },
                    selectedRound === item.value && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                  ]}
                  onPress={() => setSelectedRound(item.value as number | null)}
                >
                  <Text style={[
                    styles.filterText,
                    { color: colors.text },
                    selectedRound === item.value && styles.filterTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            />
          </View>
        )}

        <View style={[styles.filters, { borderBottomColor: colors.border }]}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Trạng thái:</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                !selectedStatus && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
              onPress={() => setSelectedStatus(null)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.text },
                !selectedStatus && styles.filterTextActive
              ]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  selectedStatus === status.value && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                ]}
                onPress={() => setSelectedStatus(status.value)}
              >
                <Text style={[
                  styles.filterText,
                  { color: colors.text },
                  selectedStatus === status.value && styles.filterTextActive
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={data?.matches || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => router.push(`/match/${item._id}` as any)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isLoading ? 'Đang tải...' : 
                 error ? 'Không thể tải danh sách trận đấu. Vui lòng thử lại.' : 
                 'Chưa có trận đấu nào'}
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    padding: 15,
    borderBottomWidth: 1,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterList: {
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
  },
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
});