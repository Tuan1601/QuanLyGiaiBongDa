import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { leagueService } from '@/services/league';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState('overview');

  const { data: league, isLoading } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const isOwner = user?._id === league?.owner?._id;

  const handleShareToken = () => {
    if (league?.accessToken) {
      Alert.alert(
        'Mã truy cập giải đấu',
        `Mã: ${league.accessToken}\n\nChia sẻ mã này để người khác có thể xem giải đấu riêng tư.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ongoing': return colors.win;
      case 'upcoming': return colors.draw;
      case 'completed': return colors.textSecondary || colors.icon;
      default: return colors.textSecondary || colors.icon;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'ongoing': return 'Đang diễn ra';
      case 'upcoming': return 'Sắp diễn ra';
      case 'completed': return 'Đã kết thúc';
      default: return 'Chưa xác định';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: league?.name || 'Chi tiết giải đấu',
          headerRight: () =>
            isOwner ? (
              <TouchableOpacity
                onPress={() => router.push(`/league/${id}/settings` as any)}
                style={styles.headerButton}>
                <Ionicons name="settings-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          {league?.logo && (
            <Image source={{ uri: league.logo }} style={styles.logo} />
          )}
          <Text style={[styles.name, { color: colors.text }]}>{league?.name}</Text>
          {league?.description && (
            <Text style={[styles.description, { color: colors.textSecondary || colors.icon }]}>
              {league.description}
            </Text>
          )}
          
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(league?.tournamentStatus) }]}>
              <Text style={styles.badgeText}>{getStatusText(league?.tournamentStatus)}</Text>
            </View>
            
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.badgeText}>
                {league?.type === 'round-robin' ? 'Vòng tròn' : 'Chia bảng'}
              </Text>
            </View>
            
            {league?.visibility === 'private' && (
              <TouchableOpacity
                style={[styles.badge, { backgroundColor: colors.draw }]}
                onPress={handleShareToken}>
                <Ionicons name="lock-closed" size={12} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.badgeText}>Riêng tư</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.stats, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {Array.isArray(league?.teams) ? league.teams.length : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary || colors.icon }]}>Đội</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {league?.numberOfTeams}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary || colors.icon }]}>Tổng số đội</Text>
          </View>
          
          {league?.startDate && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {new Date(league.startDate).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary || colors.icon }]}>Ngày bắt đầu</Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {['overview', 'teams', 'matches', 'standings'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[
                styles.tabText,
                { color: colors.textSecondary || colors.icon },
                activeTab === tab && { color: colors.primary, fontWeight: '600' }
              ]}>
                {tab === 'overview' ? 'Tổng quan' :
                 tab === 'teams' ? 'Đội bóng' :
                 tab === 'matches' ? 'Trận đấu' : 'BXH'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Thông tin giải đấu
              </Text>
              
              <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                <InfoRow 
                  label="Thể thức" 
                  value={league?.type === 'round-robin' ? 'Vòng tròn 1 lượt' : 'Chia bảng'}
                  colors={colors}
                />
                <InfoRow 
                  label="Số đội" 
                  value={`${Array.isArray(league?.teams) ? league.teams.length : 0}/${league?.numberOfTeams}`}
                  colors={colors}
                />
                {league?.groupSettings && (
                  <>
                    <InfoRow 
                      label="Số bảng" 
                      value={league.groupSettings.numberOfGroups.toString()}
                      colors={colors}
                    />
                    <InfoRow 
                      label="Đội/bảng" 
                      value={league.groupSettings.teamsPerGroup.toString()}
                      colors={colors}
                    />
                  </>
                )}
                <InfoRow 
                  label="Trạng thái" 
                  value={getStatusText(league?.tournamentStatus)}
                  colors={colors}
                />
              </View>

              {isOwner && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/league/${id}/teams` as any)}>
                    <Ionicons name="people" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Quản lý đội</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/league/${id}/matches` as any)}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Quản lý trận</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'teams' && (
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/league/${id}/teams` as any)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Xem tất cả đội bóng</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {activeTab === 'matches' && (
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/league/${id}/matches` as any)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Xem lịch thi đấu</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {activeTab === 'standings' && (
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/league/${id}/standings` as any)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Xem bảng xếp hạng</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const InfoRow = ({ label, value, colors }: { label: string; value: string; colors: any }) => (
  <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
    <Text style={[styles.infoLabel, { color: colors.textSecondary || colors.icon }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
  </View>
);

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
  headerButton: {
    marginRight: 15,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
});