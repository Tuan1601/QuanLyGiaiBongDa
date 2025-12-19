import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';
import MatchBackground from '../../../components/match/MatchBackground';

export default function UpdateResultScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = Colors;

  const { data: match } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatchById(id as string),
  });

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');

  useEffect(() => {
    if (match) {
      setHomeScore(match.score?.home?.toString() || '0');
      setAwayScore(match.score?.away?.toString() || '0');
    }
  }, [match]);

  const updateMutation = useMutation({
    mutationFn: (data: { homeScore: number; awayScore: number }) =>
      matchService.updateMatchResult(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['group-standings'] });
      
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      
      queryClient.invalidateQueries({ queryKey: ['league'] });
      
      Alert.alert(
        'Thành công',
        'Đã cập nhật kết quả. Stats của các đội đã được tính tự động.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật kết quả');
    },
  });

  const handleSubmit = () => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập tỷ số hợp lệ');
      return;
    }

    console.log('📤 Update Result Request:', {
      matchId: id,
      payload: { homeScore: home, awayScore: away },
      homeTeam: match?.homeTeam.name,
      awayTeam: match?.awayTeam.name,
    });

    Alert.alert(
      'Xác nhận',
      `Tỷ số: ${match?.homeTeam.name} ${home} - ${away} ${match?.awayTeam.name}\n\nStats của các đội sẽ được tính tự động. Tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: () => updateMutation.mutate({ homeScore: home, awayScore: away }) }
      ]
    );
  };

  return (
    <>
      <StatusBar 
        backgroundColor="rgba(214, 18, 64, 1)"
        barStyle="light-content"
      />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Cập nhật kết quả',
          headerStyle: { 
            backgroundColor: 'rgba(214, 18, 64, 1)',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
        }}
      />
      
      <MatchBackground>
        <ScrollView style={styles.container}>
        {/* MATCH HEADER */}
        <View style={styles.matchInfo}>
          <Text style={[styles.infoTitle, { color: 'rgba(255, 255, 255, 0.7)' }]}>Trận đấu</Text>
          
          {/* LOGOS ROW */}
          <View style={styles.logosRow}>
            {/* HOME TEAM */}
            <View style={styles.logoTeamContainer}>
              {match?.homeTeam.logo ? (
                <Image source={{ uri: match.homeTeam.logo }} style={styles.headerLogo} />
              ) : (
                <View style={[styles.headerLogoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.headerLogoText}>{match?.homeTeam.shortName}</Text>
                </View>
              )}
              <Text style={[styles.headerTeamName, { color: '#FFFFFF' }]} numberOfLines={1}>
                {match?.homeTeam.name}
              </Text>
            </View>

            {/* VS */}
            <Text style={[styles.headerVs, { color: 'rgba(255, 255, 255, 0.9)' }]}>vs</Text>

            {/* AWAY TEAM */}
            <View style={styles.logoTeamContainer}>
              {match?.awayTeam.logo ? (
                <Image source={{ uri: match.awayTeam.logo }} style={styles.headerLogo} />
              ) : (
                <View style={[styles.headerLogoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.headerLogoText}>{match?.awayTeam.shortName}</Text>
                </View>
              )}
              <Text style={[styles.headerTeamName, { color: '#FFFFFF' }]} numberOfLines={1}>
                {match?.awayTeam.name}
              </Text>
            </View>
          </View>

          <Text style={[styles.roundText, { color: 'rgba(255, 255, 255, 0.7)' }]}>Vòng {match?.round}</Text>
        </View>



        {/* SCORE SECTION */}
        <View style={styles.scoreSection}>
          {/* HOME SCORE */}
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              {match?.homeTeam.name}
            </Text>
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => setHomeScore(String(Math.max(0, parseInt(homeScore) - 1)))}
              >
                <Ionicons name="remove-circle" size={40} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
              <View style={styles.scoreInputContainer}>
                <TextInput
                  style={styles.scoreInput}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => setHomeScore(String(parseInt(homeScore) + 1))}
              >
                <Ionicons name="add-circle" size={40} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* AWAY SCORE */}
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              {match?.awayTeam.name}
            </Text>
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => setAwayScore(String(Math.max(0, parseInt(awayScore) - 1)))}
              >
                <Ionicons name="remove-circle" size={40} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
              <View style={styles.scoreInputContainer}>
                <TextInput
                  style={styles.scoreInput}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => setAwayScore(String(parseInt(awayScore) + 1))}
              >
                <Ionicons name="add-circle" size={40} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AUTO CALC INFO */}
        <View style={styles.autoCalc}>
          <View style={styles.autoCalcHeader}>
            <Ionicons name="calculator" size={20} color={colors.primary} />
            <Text style={[styles.autoCalcTitle, { color: colors.primary }]}>Tính toán tự động</Text>
          </View>
          <Text style={[styles.autoCalcText, { color: 'rgba(255, 255, 255, 0.85)' }]}>
            • Điểm: Thắng +3, Hòa +1, Thua 0{'\n'}
            • Stats: Played, Won, Drawn, Lost{'\n'}
            • Goals: For, Against, Difference{'\n'}
            • Form: W/D/L (5 trận gần nhất)
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            updateMutation.isPending && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật kết quả'}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </MatchBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  matchInfo: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(70, 22, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#4e1a1a44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  matchText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  roundText: {
    fontSize: 13,
    marginTop: 4,
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginVertical: 20,
  },
  logoTeamContainer: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLogoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerTeamName: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerVs: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
  },

  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 16,
  },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(70, 22, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(70, 22, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#4e1a1a44',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 36,
  },
  scoreControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInputContainer: {
    backgroundColor: 'rgba(214, 18, 64, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scoreInput: {
    width: 70,
    height: 70,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  vsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vs: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  autoCalc: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
    backgroundColor: 'rgba(70, 22, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  autoCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  autoCalcTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  autoCalcText: {
    fontSize: 13,
    lineHeight: 22,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});