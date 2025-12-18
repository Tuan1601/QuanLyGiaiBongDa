import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { League } from '../../types/index';
import { useFavorites } from '@/contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useToast } from '@/hooks/useToast';

interface LeagueCardProps {
  league: League;
}

function LeagueCard({ league }: LeagueCardProps) {
  const router = useRouter();
  const colors = Colors;

  const handlePress = useCallback(() => {
    router.push(`/league/${league._id}` as any);
  }, [league._id, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return colors.win;
      case 'upcoming': return colors.draw;
      case 'completed': return colors.textSecondary || colors.icon;
      default: return colors.textSecondary || colors.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Đang diễn ra';
      case 'upcoming': return 'Sắp diễn ra';
      case 'completed': return 'Đã kết thúc';
      default: return status;
    }
  };

  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);

  const handleFavoritePress = async (e: any) => {
    e.stopPropagation(); 
    setFavoriteLoading(true);
    try {
      const isNowFavorite = await toggleFavorite({
        _id: league._id,
        name: league.name,
        logo: league.logo,
        type: league.type,
        visibility: league.visibility,
        description: league.description,
        numberOfTeams: league.numberOfTeams,
        teamsCount: Array.isArray(league.teams) ? league.teams.length : 0,
      });
      toast.showSuccess(
        isNowFavorite ? 'Đã thêm quan tâm' : 'Đã bỏ quan tâm',
        league.name
      );
    } catch (error) {
      toast.showError('Lỗi', 'Không thể cập nhật');
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Giải đấu ${league.name}`}
      accessibilityHint="Nhấn để xem chi tiết giải đấu"
    >
      
      {league.logo && (
        <Image 
          source={{ uri: league.logo }}
          style={styles.logo}
          contentFit="cover"
          transition={200}
          placeholder={require('@/assets/images/icon.png')}
        />
      )}
      
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{league.name}</Text>
        
        {league.description && (
          <Text style={[styles.description, { color: colors.textSecondary || colors.icon }]} numberOfLines={2}>
            {league.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={[styles.badge, { backgroundColor: getStatusColor(league.tournamentStatus) }]}>
            <Text style={styles.badgeText}>
              {getStatusText(league.tournamentStatus)}
            </Text>
          </View>
          
          <Text style={[styles.teams, { color: colors.textSecondary || colors.icon }]}>
            {Array.isArray(league.teams) ? league.teams.length : 0}/{league.numberOfTeams} đội
          </Text>
        </View>
      </View>


      <View style={styles.favoriteButton}>
        <FavoriteButton
          isFavorite={isFavorite(league._id)}
          onPress={handleFavoritePress}
          loading={favoriteLoading}
        />
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(LeagueCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  teams: {
    fontSize: 14,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
});