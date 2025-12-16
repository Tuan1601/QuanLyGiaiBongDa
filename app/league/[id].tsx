import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { leagueService } from '@/services/league';
import { matchService } from '@/services/match';
import { standingsService } from '@/services/standings';
import { teamService } from '@/services/team';
import StandingsTable from '@/components/standings/StandingsTable';
import MatchCard from '@/components/match/MatchCard';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getLeagueToken } from '@/utils/leagueLink';

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState('overview');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getLeagueToken(id as string);
        setSavedToken(token);
      } catch (error) {
        console.error('Error loading saved token:', error);
      } finally {
        setTokenLoaded(true);
      }
    };
    loadToken();
  }, [id]);

  const { data: league, isLoading } = useQuery({
    queryKey: ['league', id, savedToken],
    queryFn: () => leagueService.getLeagueById(id as string, savedToken || undefined),
    enabled: tokenLoaded,
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams', id, savedToken],
    queryFn: () => teamService.getTeamsByLeague(id as string, savedToken || league?.accessToken),
    enabled: !!id && tokenLoaded,
  });

  const { data: matchesData } = useQuery({
    queryKey: ['matches', id, savedToken],
    queryFn: () => matchService.getMatchesByLeague(id as string, savedToken || league?.accessToken),
    enabled: !!id && tokenLoaded,
  });

  const isGroupStage = league?.type === 'group-stage';
  
  const { data: standingsData } = useQuery({
    queryKey: ['standings', id, savedToken],
    queryFn: () => standingsService.getStandings(id as string, savedToken || league?.accessToken),
    enabled: !!id && !isGroupStage && tokenLoaded,
  });

  const { data: groupStandingsData } = useQuery({
    queryKey: ['group-standings', id, savedToken],
    queryFn: () => standingsService.getAllGroupsStandings(id as string, savedToken || league?.accessToken),
    enabled: !!id && isGroupStage && tokenLoaded,
  });

  const { data: statisticsData } = useQuery({
    queryKey: ['statistics', id, savedToken],
    queryFn: () => standingsService.getLeagueStats(id as string, savedToken || league?.accessToken),
    enabled: !!id && tokenLoaded,
  });

  const leagueOwnerId = typeof league?.owner === 'object' ? league.owner._id : league?.owner;
  const isOwner = user?._id && leagueOwnerId && user._id === leagueOwnerId;

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
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () =>
            isOwner ? (
              <TouchableOpacity
                onPress={() => router.push(`/league/${id}/settings` as any)}
                style={styles.headerButton}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {!user && (
          <View style={[styles.guestPrompt, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <View style={styles.guestPromptContent}>
              <Ionicons name="log-in-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestPromptTitle, { color: colors.text }]}>
                  Tạo giải đấu của riêng bạn!
                </Text>
                <Text style={[styles.guestPromptText, { color: colors.textSecondary }]}>
                  Đăng nhập để tạo và quản lý giải đấu
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.guestPromptButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/login')}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              {teamsData?.total || 0}
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
          {['overview', 'teams', 'matches', 'standings', 'statistics'].map((tab) => (
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
                 tab === 'matches' ? 'Trận đấu' :
                 tab === 'standings' ? 'BXH' : 'Thống kê'}
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
              
              {isOwner && matchesData?.matches && matchesData.matches.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton, { backgroundColor: '#FF9500' + '10', borderWidth: 1, borderColor: '#FF9500' }]}
                  onPress={() => router.push(`/league/${id}/actions` as any)}>
                  <Ionicons name="warning"  size={20} color="#FF9500" />
                  <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>Hành động</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'teams' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Đội bóng ({teamsData?.total || 0}/{league?.numberOfTeams})
                </Text>
                <TouchableOpacity onPress={() => router.push(`/league/${id}/teams` as any)}>
                  <Text style={[styles.viewAllLink, { color: colors.primary }]}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              {teamsData?.teams && teamsData.teams.length > 0 ? (
                <View>
                  {teamsData.teams.slice(0, 3).map((team: any, index: number) => (
                    <TouchableOpacity 
                      key={team._id || index} 
                      style={[styles.teamPreview, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/team/${team._id}` as any)}
                    >
                      <View style={styles.teamInfo}>
                        {team.logo ? (
                          <Image source={{ uri: team.logo }} style={styles.teamLogo} />
                        ) : (
                          <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.teamLogoText}>{team.shortName || team.name?.substring(0, 2)}</Text>
                          </View>
                        )}
                        <View style={styles.teamDetails}>
                          <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
                          {team.group && (
                            <Text style={[styles.teamGroup, { color: colors.textSecondary }]}>Bảng {team.group}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.teamStats}>
                        <Text style={[styles.teamPoints, { color: colors.primary }]}>
                          {team.stats?.points || 0} điểm
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {teamsData.teams.length > 3 && (
                    <TouchableOpacity
                      style={[styles.showMoreButton, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/league/${id}/teams` as any)}>
                      <Text style={[styles.showMoreText, { color: colors.primary }]}>
                        Xem thêm {teamsData.teams.length - 3} đội
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có đội bóng</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Thêm đội bóng để bắt đầu giải đấu
                  </Text>
                  {isOwner && (
                    <TouchableOpacity
                      style={[styles.emptyAction, { backgroundColor: colors.primary }]}
                      onPress={() => router.push(`/league/${id}/teams` as any)}>
                      <Text style={styles.emptyActionText}>Thêm đội bóng</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'matches' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Trận đấu gần đây</Text>
                <TouchableOpacity onPress={() => router.push(`/league/${id}/matches` as any)}>
                  <Text style={[styles.viewAllLink, { color: colors.primary }]}>Xem lịch đấu</Text>
                </TouchableOpacity>
              </View>

              {matchesData?.matches && matchesData.matches.length > 0 ? (
                <View>
                  {(() => {
                    const now = new Date();
                    
                    const sortedMatches = [...matchesData.matches].sort((a: any, b: any) => {
                      if (a.status === 'live' && b.status !== 'live') return -1;
                      if (a.status !== 'live' && b.status === 'live') return 1;
                      
                      const aDate = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
                      const bDate = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
                      
                      const aIsPast = a.status === 'finished' || aDate < now;
                      const bIsPast = b.status === 'finished' || bDate < now;
                      
                      if (!aIsPast && !bIsPast) {
                        return aDate.getTime() - bDate.getTime();
                      }
                      
                      if (!aIsPast && bIsPast) return -1;
                      if (aIsPast && !bIsPast) return 1;
                      
                      return bDate.getTime() - aDate.getTime();
                    });
                    
                    return sortedMatches.slice(0, 3).map((match: any, index: number) => (
                      <MatchCard
                        key={match._id || index}
                        match={match}
                        onPress={() => router.push(`/match/${match._id}` as any)}
                      />
                    ));
                  })()}
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có lịch thi đấu</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Tạo lịch thi đấu để bắt đầu giải đấu
                  </Text>
                  {isOwner && (
                    <TouchableOpacity
                      style={[styles.emptyAction, { backgroundColor: colors.primary }]}
                      onPress={() => router.push(`/league/${id}/generate-schedule` as any)}>
                      <Text style={styles.emptyActionText}>Tạo lịch thi đấu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.showMoreButton, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/league/${id}/matches` as any)}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>Xem tất cả trận đấu</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'standings' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bảng xếp hạng</Text>
                <TouchableOpacity onPress={() => router.push(`/league/${id}/standings` as any)}>
                  <Text style={[styles.viewAllLink, { color: colors.primary }]}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>

              {!isGroupStage && standingsData?.standings && standingsData.standings.length > 0 ? (
                <StandingsTable standings={standingsData.standings.slice(0, 3)} />
              ) : isGroupStage && groupStandingsData?.groups ? (
                <View>
                  {Object.entries(groupStandingsData.groups)
                    .slice(0, 3)
                    .map(([groupName, teams]: [string, any]) => (
                      <View key={groupName} style={{ marginBottom: 20 }}>
                        <Text style={[styles.groupLabel, { color: colors.text }]}>Bảng {groupName}</Text>
                        <StandingsTable standings={teams.slice(0, 3)} />
                      </View>
                    ))}
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có bảng xếp hạng</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Cần có kết quả trận đấu để tạo bảng xếp hạng
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.showMoreButton, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/league/${id}/standings` as any)}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>Xem bảng xếp hạng đầy đủ</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'statistics' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống kê nổi bật</Text>
                <TouchableOpacity onPress={() => router.push(`/league/${id}/statistics` as any)}>
                  <Text style={[styles.viewAllLink, { color: colors.primary }]}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>

              {statisticsData?.stats ? (
                <View>
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                      <Text style={[styles.statCardValue, { color: colors.primary }]}>
                        {statisticsData.stats?.matchesPlayed || 0}
                      </Text>
                      <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Trận đã đấu</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                      <Text style={[styles.statCardValue, { color: colors.primary }]}>
                        {statisticsData.stats?.totalGoals || 0}
                      </Text>
                      <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Bàn thắng</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                      <Text style={[styles.statCardValue, { color: colors.primary }]}>
                        {statisticsData.stats?.averageGoalsPerMatch?.toFixed(1) || '0.0'}
                      </Text>
                      <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>TB bàn/trận</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                      <Text style={[styles.statCardValue, { color: colors.primary }]}>
                        {statisticsData.stats?.totalTeams || 0}
                      </Text>
                      <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Đội tham gia</Text>
                    </View>
                  </View>

                  <View style={[styles.topPerformers, { backgroundColor: colors.card }]}>
                    {statisticsData.topScorers && statisticsData.topScorers.length > 0 && (
                      <>
                        <Text style={[styles.topPerformersTitle, { color: colors.text }]}>Tấn công tốt nhất</Text>
                        <TouchableOpacity 
                          style={styles.performerItem}
                          onPress={() => router.push(`/team/${statisticsData.topScorers[0].team._id}` as any)}
                        >
                          <View style={styles.performerInfo}>
                            {statisticsData.topScorers[0].team.logo ? (
                              <Image source={{ uri: statisticsData.topScorers[0].team.logo }} style={styles.teamLogoSmall} />
                            ) : (
                              <View style={[styles.teamLogoSmall, { backgroundColor: colors.primary }]}>
                                <Text style={styles.teamLogoTextSmall}>
                                  {statisticsData.topScorers[0].team.shortName}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.performerName, { color: colors.text }]}>
                              {statisticsData.topScorers[0].team.name}
                            </Text>
                          </View>
                          <Text style={[styles.performerValue, { color: colors.win }]}>
                            {statisticsData.topScorers[0].stats?.goalsFor || 0} bàn
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {statisticsData.bestDefense && statisticsData.bestDefense.length > 0 && (
                      <>
                        <Text style={[styles.topPerformersTitle, { color: colors.text }]}>Phòng thủ tốt nhất</Text>
                        <TouchableOpacity 
                          style={styles.performerItem}
                          onPress={() => router.push(`/team/${statisticsData.bestDefense[0].team._id}` as any)}
                        >
                          <View style={styles.performerInfo}>
                            {statisticsData.bestDefense[0].team.logo ? (
                              <Image source={{ uri: statisticsData.bestDefense[0].team.logo }} style={styles.teamLogoSmall} />
                            ) : (
                              <View style={[styles.teamLogoSmall, { backgroundColor: colors.primary }]}>
                                <Text style={styles.teamLogoTextSmall}>
                                  {statisticsData.bestDefense[0].team.shortName}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.performerName, { color: colors.text }]}>
                              {statisticsData.bestDefense[0].team.name}
                            </Text>
                          </View>
                          <Text style={[styles.performerValue, { color: colors.secondary }]}>
                            {statisticsData.bestDefense[0].stats?.goalsAgainst || 0} bàn thua
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="stats-chart-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có thống kê</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Cần có kết quả trận đấu để tạo thống kê
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.showMoreButton, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/league/${id}/statistics` as any)}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>Xem thống kê đầy đủ</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
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
    padding:5,
 
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
  dangerButton: {
    width: '100%',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  teamLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamGroup: {
    fontSize: 12,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchesPreview: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchTeam: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  matchVs: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  matchInfo: {
    alignItems: 'flex-end',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchDate: {
    fontSize: 12,
    marginTop: 2,
  },
  standingsPreview: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  standingsHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  positionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  standingsTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teamLogoTextSmall: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  standingsTeamName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  standingsValue: {
    fontSize: 14,
    width: 30,
    textAlign: 'center',
  },
  standingsPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statCardLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  topPerformers: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  topPerformersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  performerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  performerValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  guestPrompt: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  guestPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guestPromptText: {
    fontSize: 14,
  },
  guestPromptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});