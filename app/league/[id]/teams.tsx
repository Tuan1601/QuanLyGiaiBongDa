import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TeamCard from '../../../components/team/TeamCard';
import { Colors } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { useLeagueToken } from '../../../hooks/useLeagueToken';
import { leagueService } from '../../../services/league';
import { teamService } from '../../../services/team';

export default function TeamsListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { savedToken, tokenLoaded } = useLeagueToken(id);

  const { data: league } = useQuery({
    queryKey: ['league', id, savedToken],
    queryFn: () => leagueService.getLeagueById(id as string, savedToken || undefined),
    enabled: tokenLoaded,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['teams', id, selectedGroup, savedToken],
    queryFn: () => selectedGroup 
     ? teamService.getTeamsByGroup(id as string, selectedGroup, savedToken || undefined)
      : teamService.getTeamsByLeague(id as string, savedToken || undefined),
    enabled: tokenLoaded,
    retry: (failureCount, error: any) => {
      if (error.message?.includes('timeout') && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const groups = league?.groupSettings
    ? Array.from({ length: league.groupSettings.numberOfGroups }, (_, i) =>
        String.fromCharCode(65 + i)
      )
    : [];

  const isOwner = user?._id === league?.owner?._id;
  const isGroupStage = league?.type === 'group-stage';
  const teamsCount = data?.teams?.length || 0;
  const requiredTeams = league?.numberOfTeams || 0;
  const canAssignGroups = isGroupStage && teamsCount >= requiredTeams && isOwner;
  
  const hasAssignedGroups = data?.teams?.some((team: any) => team.group !== null) || false;
  
  const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);

  const handleAssignGroups = () => {
    if (!canAssignGroups) return;
    
    Alert.alert(
      'Phân bảng tự động',
      'Bạn có muốn phân bảng tự động cho các đội?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Phân bảng', 
          onPress: () => router.push(`/league/${id}/assign-groups` as any)
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Đội bóng (${teamsCount}/${requiredTeams})`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => isOwner ? (
            <View style={styles.headerActions}>
              {canAssignGroups && (
                <TouchableOpacity
                  onPress={handleAssignGroups}
                  style={[styles.headerButton, { marginRight: 10 }]}
                >
                  <Ionicons name="grid-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push(`/league/${id}/add-team`)}
                style={styles.headerButton}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null,
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isOwner && (
          <View style={[styles.ownerActions, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/league/${id}/add-team` as any)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Thêm đội</Text>
              </TouchableOpacity>
              
              {isGroupStage && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.actionButtonSecondary,
                    { borderColor: colors.primary },
                    !canAssignGroups && styles.actionButtonDisabled
                  ]}
                  onPress={() => router.push(`/league/${id}/assign-groups` as any)}
                  disabled={!canAssignGroups}
                >
                  <Ionicons 
                    name="grid-outline" 
                    size={20} 
                    color={canAssignGroups ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.actionButtonTextSecondary,
                    { color: canAssignGroups ? colors.primary : colors.textSecondary }
                  ]}>
                    Phân bảng
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isGroupStage && !hasAssignedGroups && teamsCount < requiredTeams && (
              <View style={[styles.warning, { backgroundColor: colors.draw + '20' }]}>
                <Ionicons name="warning-outline" size={16} color={colors.draw} />
                <Text style={[styles.warningText, { color: colors.draw }]}>
                  Cần thêm {requiredTeams - teamsCount} đội nữa để phân bảng
                </Text>
              </View>
            )}
          </View>
        )}

        {groups.length > 0 && (
          <View style={[styles.filters, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                !selectedGroup && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
              onPress={() => setSelectedGroup(null)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.text },
                !selectedGroup && styles.filterTextActive
              ]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            
            {groups.map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  selectedGroup === group && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                ]}
                onPress={() => setSelectedGroup(group)}
              >
                <Text style={[
                  styles.filterText,
                  { color: colors.text },
                  selectedGroup === group && styles.filterTextActive
                ]}>
                  Bảng {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={data?.teams || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              onPress={() => router.push(`/team/${item._id}` as any)}
              onEdit={() => router.push(`/team/${item._id}/edit` as any)}
              showActions={isOwner}
              leagueId={id as string}
              isMenuOpen={openMenuTeamId === item._id}
              onToggleMenu={() => setOpenMenuTeamId(openMenuTeamId === item._id ? null : item._id)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.border }]}>
                <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isLoading ? 'Đang tải...' : 
                 error ? 'Không thể tải danh sách đội. Vui lòng thử lại.' : 
                 'Chưa có đội bóng nào'}
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/league/${id}/add-team`)}
              >
                <Text style={styles.addButtonText}>Thêm đội</Text>
              </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  headerButton: {
  },
  ownerActions: {
    padding: 15,
    borderBottomWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
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
    fontSize: 14,
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});