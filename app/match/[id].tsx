import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { matchService } from '../../services/match';
import { leagueService } from '../../services/league';
import VideoPlayer from '../../components/media/VideoPlayer';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colors = Colors;

  const { data: match, isLoading: matchLoading, isError, error } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatchById(id as string),
    retry: 1, 
  });

  const leagueId = typeof match?.league === 'object' ? match.league._id : match?.league;

  const { data: league } = useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => leagueService.getLeagueById(leagueId as string),
    enabled: !!leagueId,
    retry: 1,
  });

  const leagueOwnerId = typeof league?.owner === 'object' ? league.owner._id : league?.owner;
  const isOwner = user?._id && leagueOwnerId && user._id === leagueOwnerId;

  const handleOpenVideo = (url: string) => {
    Linking.openURL(url);
  };

  if (matchLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          Không thể tải trận đấu
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
          {error?.message?.includes('500') 
            ? 'Server đang gặp sự cố. Vui lòng thử lại sau.' 
            : 'Vui lòng kiểm tra kết nối mạng và thử lại.'}
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy trận đấu</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Chi tiết trận đấu',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () =>
            isOwner ? (
              <TouchableOpacity
                onPress={() => router.push(`/match/${id}/edit-info` as any)}
                style={styles.headerButton}
              >
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.matchHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.round, { color: colors.textSecondary }]}>Vòng {match.round}</Text>
          <View style={styles.teamsContainer}>
            <View style={styles.teamSection}>
              {match.homeTeam.logo ? (
                <Image source={{ uri: match.homeTeam.logo }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.logoText}>{match.homeTeam.shortName}</Text>
                </View>
              )}
              <Text style={[styles.teamName, { color: colors.text }]}>{match.homeTeam.name}</Text>
            </View>

            <View style={styles.scoreSection}>
              {match.status === 'finished' ? (
                <>
                  <View style={styles.scoreDisplay}>
                    <Text style={[styles.scoreNumber, { color: colors.primary }]}>{match.score?.home || 0}</Text>
                    <Text style={[styles.scoreSep, { color: colors.textSecondary }]}>-</Text>
                    <Text style={[styles.scoreNumber, { color: colors.primary }]}>{match.score?.away || 0}</Text>
                  </View>
                  <Text style={[styles.statusFinished, { color: colors.win }]}>Kết thúc</Text>
                </>
              ) : match.status === 'live' ? (
                <>
                  <View style={styles.scoreDisplay}>
                    <Text style={[styles.scoreNumber, { color: colors.primary }]}>{match.score?.home || 0}</Text>
                    <Text style={[styles.scoreSep, { color: colors.textSecondary }]}>-</Text>
                    <Text style={[styles.scoreNumber, { color: colors.primary }]}>{match.score?.away || 0}</Text>
                  </View>
                  <View style={[styles.liveBadge, { backgroundColor: colors.lose }]}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>
                  {match.scheduledDate && (
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      {new Date(match.scheduledDate).toLocaleString('vi-VN')}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.teamSection}>
              {match.awayTeam.logo ? (
                <Image source={{ uri: match.awayTeam.logo }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.logoText}>{match.awayTeam.shortName}</Text>
                </View>
              )}
              <Text style={[styles.teamName, { color: colors.text }]}>{match.awayTeam.name}</Text>
            </View>
          </View>
        </View>

        {(match.venue || match.referee) && (
          <View style={[styles.infoSection, { borderBottomColor: colors.border }]}>
            {match.venue && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{match.venue}</Text>
              </View>
            )}
            {match.referee && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>Trọng tài: {match.referee}</Text>
              </View>
            )}
          </View>
        )}

        {match.videoUrl && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Video trận đấu</Text>
            <TouchableOpacity
              style={[styles.videoButton, { backgroundColor: colors.card }]}
              onPress={() => handleOpenVideo(match.videoUrl)}
            >
              <Ionicons name="play-circle" size={40} color={colors.primary} />
              <Text style={[styles.videoButtonText, { color: colors.primary }]}>Xem video full trận</Text>
            </TouchableOpacity>
          </View>
        )}

        {match.highlightVideos && match.highlightVideos.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎬 Highlights ({match.highlightVideos.length})
            </Text>
            <View style={styles.highlightsContainer}>
              {match.highlightVideos.map((highlight: any) => (
                <VideoPlayer
                  key={highlight._id}
                  uri={highlight.url}
                  title={highlight.title || 'Highlight'}
                />
              ))}
            </View>
          </View>
        )}

        {match.photos && match.photos.length > 0 && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ảnh trận đấu ({match.photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {match.photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                />
              ))}
            </View>
          </View>
        )}

        {match.notes && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ghi chú</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{match.notes}</Text>
          </View>
        )}

        {isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/match/${id}/update-result` as any)}
            >
              <Ionicons name="trophy-outline" size={20} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                {match.status === 'finished' ? 'Sửa kết quả' : 'Cập nhật kết quả'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push(`/match/${id}/status` as any)}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonTextSmall, { color: colors.primary }]}>Trạng thái</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push(`/match/${id}/upload-media` as any)}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonTextSmall, { color: colors.primary }]}>Upload</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push(`/match/${id}/actions` as any)}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonTextSmall, { color: colors.primary }]}>Khác</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.standingsSection}>
          <TouchableOpacity
            style={[styles.standingsButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push(`/league/${leagueId}/standings` as any)}
          >
            <Ionicons name="podium-outline" size={22} color={colors.primary} />
            <Text style={[styles.standingsButtonText, { color: colors.primary }]}>Xem Bảng xếp hạng</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 5,
    marginLeft:3,
  },
  matchHeader: {
    padding: 20,
  },
  round: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  scoreSep: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  statusFinished: {
    fontSize: 13,
    fontWeight: '600',
  },
  liveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 10,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 10,
  },
  videoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  highlightTitle: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photo: {
    width: '48%',
    height: 150,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  highlightsContainer: {
    gap: 10,
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonTextSmall: {
    fontSize: 13,
    fontWeight: '600',
  },
  standingsSection: {
    padding: 20,
    paddingTop: 10,
  },
  standingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  standingsButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});