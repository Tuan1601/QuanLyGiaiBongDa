import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { teamService } from '../../../services/team';

export default function EditTeamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = Colors;

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [group, setGroup] = useState('');
  const [logo, setLogo] = useState<any>(null);

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getTeamById(id as string),
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => teamService.updateTeam(id as string, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['league'] }); 
      queryClient.invalidateQueries({ queryKey: ['standings'] }); 
      queryClient.invalidateQueries({ queryKey: ['group-standings'] }); 
      Alert.alert('Thành công', 'Cập nhật đội thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật đội');
    },
  });

  useEffect(() => {
    if (team) {
      setName(team.name);
      setShortName(team.shortName);
      setGroup(team.group || '');
    }
  }, [team]);

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogo(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !shortName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (shortName.length < 2 || shortName.length > 5) {
      Alert.alert('Lỗi', 'Tên viết tắt phải từ 2-5 ký tự');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('shortName', shortName.toUpperCase());

    if (group && team?.league?.type === 'group-stage') {
      formData.append('group', group);
    }

    if (logo) {
      formData.append('logo', {
        uri: logo.uri,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any);
    }

    updateMutation.mutate(formData);
  };

  const groups = team?.league?.groupSettings
    ? Array.from({ length: team.league.groupSettings.numberOfGroups }, (_, i) =>
        String.fromCharCode(65 + i)
      )
    : [];

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Chỉnh sửa đội',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.form}>
          {/* Current Logo */}
          <View style={styles.logoSection}>
            <Text style={[styles.label, { color: colors.text }]}>Logo hiện tại</Text>
            <View style={styles.logoContainer}>
              {team?.logo ? (
                <Image source={{ uri: team.logo }} style={styles.currentLogo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.logoPlaceholderText}>{team?.shortName}</Text>
                </View>
              )}
              <TouchableOpacity 
                style={[styles.changeLogoButton, { backgroundColor: colors.primary }]}
                onPress={handlePickLogo}
              >
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.changeLogoText}>
                  {logo ? 'Đã chọn logo mới' : 'Thay đổi logo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Tên đội *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="VD: Manchester United"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.text }]}>Tên viết tắt * (2-5 ký tự)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="VD: MUN"
            placeholderTextColor={colors.textSecondary}
            value={shortName}
            onChangeText={setShortName}
            autoCapitalize="characters"
            maxLength={5}
          />

          {team?.league?.type === 'group-stage' && groups.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>Bảng đấu</Text>
              <View style={styles.groupContainer}>
                {groups.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.groupButton,
                      { borderColor: colors.border },
                      group === g && [styles.groupButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => setGroup(g)}
                  >
                    <Text style={[
                      styles.groupText,
                      { color: colors.text },
                      group === g && styles.groupTextActive
                    ]}>
                      Bảng {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

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
              {updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật đội'}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  logoSection: {
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 15,
  },
  currentLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  changeLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  groupButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupButtonActive: {
  },
  groupText: {
    fontSize: 14,
  },
  groupTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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