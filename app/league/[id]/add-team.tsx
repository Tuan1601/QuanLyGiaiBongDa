import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { useToast } from '../../../hooks/useToast';
import { leagueService } from '../../../services/league';
import { teamService } from '../../../services/team';

export default function AddTeamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logo, setLogo] = useState<any>(null);
  const toast = useToast();

  const { data: league } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => teamService.createTeam(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
      queryClient.invalidateQueries({ queryKey: [' league', id] }); // Update team count in league detail
      toast.showSuccess('Thành công', 'Đã thêm đội mới');
      setTimeout(() => router.back(), 500);
    },
    onError: (error: any) => {
      console.error('Team creation error:', error);
      
      let errorMessage = 'Không thể thêm đội';
      
      // Check for authentication errors first
      if (error.name === 'AuthenticationError' || error.message?.includes('Phiên đăng nhập')) {
        errorMessage = error.message;
        Alert.alert('Phiên đăng nhập hết hạn', errorMessage, [
          { text: 'OK', onPress: () => router.replace('/auth/login' as any) }
        ]);
        return;
      }
      
      if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        errorMessage = 'Kết nối chậm. Vui lòng thử lại sau.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng kiểm tra thông tin và thử lại.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.showError('Lỗi', errorMessage);
    },
  });

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
    formData.append('leagueId', id as string);



    if (logo) {
      formData.append('logo', {
        uri: logo.uri,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any);
    }

    console.log('Creating team with data:', {
      name,
      shortName: shortName.toUpperCase(),
      leagueId: id,
      hasLogo: !!logo,
    });

    createMutation.mutate(formData);
  };



  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Thêm Đội Mới',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Tên đội</Text>
            <Text style={[styles.required, { color: colors.lose }]}>*</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Ví dụ: Manchester United"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Tên viết tắt</Text>
            <Text style={[styles.required, { color: colors.lose }]}>*</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>(2-5 ký tự)</Text>
          </View>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Ví dụ: MUN"
            placeholderTextColor={colors.textSecondary}
            value={shortName}
            onChangeText={setShortName}
            autoCapitalize="characters"
            maxLength={5}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Logo đội</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>(Tùy chọn)</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.logoPicker,
              { borderColor: colors.border, backgroundColor: colors.card }
            ]} 
            onPress={handlePickLogo}
            activeOpacity={0.7}
          >
            {logo ? (
              <View style={styles.logoSelected}>
                <View style={[styles.logoCheckmark, { backgroundColor: colors.win }]}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
                <Text style={[styles.logoSelectedText, { color: colors.text }]}>Logo đã được chọn</Text>
                <Text style={[styles.logoHint, { color: colors.textSecondary }]}>Nhấn để thay đổi</Text>
              </View>
            ) : (
              <View style={styles.logoEmpty}>
                <View style={[styles.logoIconContainer, { backgroundColor: colors.border }]}>
                  <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.logoEmptyText, { color: colors.text }]}>Chọn logo cho đội</Text>
                <Text style={[styles.logoHint, { color: colors.textSecondary }]}>JPG, PNG - Tỷ lệ 1:1</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              createMutation.isPending && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {createMutation.isPending ? 'Đang thêm đội...' : 'Thêm đội vào giải'}
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
    gap: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  required: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logoPicker: {
    minHeight: 160,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
  },
  logoSelected: {
    alignItems: 'center',
    gap: 8,
  },
  logoCheckmark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoSelectedText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  logoEmpty: {
    alignItems: 'center',
    gap: 8,
  },
  logoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  logoHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});