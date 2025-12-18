import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';

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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Cập nhật kết quả',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.matchInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Trận đấu</Text>
          <Text style={[styles.matchText, { color: colors.text }]}>
            {match?.homeTeam.name} vs {match?.awayTeam.name}
          </Text>
          <Text style={[styles.roundText, { color: colors.textSecondary }]}>Vòng {match?.round}</Text>
        </View>

        <View style={styles.scoreForm}>
          <View style={styles.teamScore}>
            <Text style={[styles.teamName, { color: colors.text }]}>{match?.homeTeam.shortName}</Text>
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: colors.card }]}
                onPress={() => setHomeScore(String(Math.max(0, parseInt(homeScore) - 1)))}
              >
                <Ionicons name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.scoreInput, { borderColor: colors.primary, color: colors.primary }]}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: colors.card }]}
                onPress={() => setHomeScore(String(parseInt(homeScore) + 1))}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.vs, { color: colors.textSecondary }]}>-</Text>

          <View style={styles.teamScore}>
            <Text style={[styles.teamName, { color: colors.text }]}>{match?.awayTeam.shortName}</Text>
            <View style={styles.scoreControl}>
              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: colors.card }]}
                onPress={() => setAwayScore(String(Math.max(0, parseInt(awayScore) - 1)))}
              >
                <Ionicons name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.scoreInput, { borderColor: colors.primary, color: colors.primary }]}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity
                style={[styles.scoreButton, { backgroundColor: colors.card }]}
                onPress={() => setAwayScore(String(parseInt(awayScore) + 1))}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.autoCalc, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.autoCalcTitle, { color: colors.primary }]}>✨ Tính toán tự động</Text>
          <Text style={[styles.autoCalcText, { color: colors.text }]}>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  matchInfo: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  matchText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  roundText: {
    fontSize: 14,
  },
  scoreForm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scoreControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vs: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  autoCalc: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  autoCalcTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  autoCalcText: {
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});