import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
          headerTitle: 'Thêm đội mới',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.form}>
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

          <Text style={[styles.label, { color: colors.text }]}>Logo đội</Text>
          <TouchableOpacity 
            style={[styles.logoPicker, { borderColor: colors.border }]} 
            onPress={handlePickLogo}
          >
            {logo ? (
              <Text style={[styles.logoText, { color: colors.win }]}>✓ Đã chọn logo</Text>
            ) : (
              <>
                <Ionicons name="image-outline" size={60} color={colors.textSecondary} />
                <Text style={[styles.logoText, { color: colors.textSecondary }]}>Chọn logo</Text>
              </>
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
          >
            <Text style={styles.buttonText}>
              {createMutation.isPending ? 'Đang thêm...' : 'Thêm đội'}
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

  logoPicker: {
    height: 120,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    marginTop: 10,
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