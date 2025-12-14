import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { matchService } from '../../../services/match';

export default function EditMatchInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: match } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatchById(id as string),
  });

  const [scheduledDate, setScheduledDate] = useState('');
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (match) {
      setScheduledDate(match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : '');
      setVenue(match.venue || '');
      setReferee(match.referee || '');
      setNotes(match.notes || '');
    }
  }, [match]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => matchService.updateMatchInfo(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      Alert.alert('Thành công', 'Đã cập nhật thông tin trận đấu', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật');
    },
  });

  const handleSubmit = () => {
    const data: any = {};
    
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate).toISOString();
    if (venue.trim()) data.venue = venue.trim();
    if (referee.trim()) data.referee = referee.trim();
    if (notes.trim()) data.notes = notes.trim();

    updateMutation.mutate(data);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Cập nhật thông tin',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Ngày giờ thi đấu</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="YYYY-MM-DDTHH:MM"
            placeholderTextColor={colors.textSecondary}
            value={scheduledDate}
            onChangeText={setScheduledDate}
          />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Ví dụ: 2024-12-25T15:00</Text>

          <Text style={[styles.label, { color: colors.text }]}>Sân đấu</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="VD: Sân Mỹ Đình"
            placeholderTextColor={colors.textSecondary}
            value={venue}
            onChangeText={setVenue}
          />

          <Text style={[styles.label, { color: colors.text }]}>Trọng tài</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="VD: Nguyễn Văn A"
            placeholderTextColor={colors.textSecondary}
            value={referee}
            onChangeText={setReferee}
          />

          <Text style={[styles.label, { color: colors.text }]}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
            placeholder="Ghi chú về trận đấu..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

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
              {updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Text>
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: -15,
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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