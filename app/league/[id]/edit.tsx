import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as yup from 'yup';
import { AnimatedInput } from '../../../components/ui/animated-input';
import { Button } from '../../../components/ui/button';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { leagueService } from '../../../services/league';

const schema = yup.object({
  name: yup.string().required('Tên giải đấu là bắt buộc').min(3, 'Tối thiểu 3 ký tự'),
  description: yup.string().max(500, 'Mô tả tối đa 500 ký tự'),
  startDate: yup.string(),
  endDate: yup.string(),
});

export default function EditLeagueScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: league, isLoading } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueService.getLeagueById(id as string),
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: league?.name || '',
      description: league?.description || '',
      startDate: league?.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
      endDate: league?.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
    },
  });

  React.useEffect(() => {
    if (league) {
      setValue('name', league.name);
      setValue('description', league.description || '');
      setValue('startDate', league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '');
      setValue('endDate', league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '');
    }
  }, [league, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => leagueService.updateLeague(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', id] });
      Alert.alert('Thành công', 'Cập nhật thông tin giải đấu thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin');
    },
  });

  const logoMutation = useMutation({
    mutationFn: (formData: FormData) => leagueService.updateLeague(id as string, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', id] });
      Alert.alert('Thành công', 'Cập nhật logo thành công');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật logo');
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const updateData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      
      updateMutation.mutate(updateData);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogoUploading(true);
      try {
        const formData = new FormData();
        formData.append('logo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'logo.jpg',
        } as any);

        logoMutation.mutate(formData);
      } finally {
        setLogoUploading(false);
      }
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Xóa logo',
      'Bạn có chắc chắn muốn xóa logo giải đấu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const formData = new FormData();
            formData.append('removeLogo', 'true');
            logoMutation.mutate(formData);
          }
        }
      ]
    );
  };

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
          headerTitle: 'Chỉnh sửa thông tin',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Logo Section */}
        <View style={[styles.logoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Logo giải đấu</Text>
          
          <View style={styles.logoContainer}>
            {league?.logo ? (
              <Image source={{ uri: league.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
              </View>
            )}
            
            <View style={styles.logoActions}>
              <TouchableOpacity
                style={[styles.logoButton, { backgroundColor: colors.primary }]}
                onPress={handleChangeLogo}
                disabled={logoUploading}
              >
                <Ionicons 
                  name={logoUploading ? "hourglass" : "camera"} 
                  size={16} 
                  color="#fff" 
                />
                <Text style={styles.logoButtonText}>
                  {logoUploading ? 'Đang tải...' : 'Thay đổi'}
                </Text>
              </TouchableOpacity>
              
              {league?.logo && (
                <TouchableOpacity
                  style={[styles.logoButton, styles.logoButtonSecondary, { borderColor: colors.lose }]}
                  onPress={handleRemoveLogo}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.lose} />
                  <Text style={[styles.logoButtonText, { color: colors.lose }]}>Xóa</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Tên giải đấu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                placeholder="VD: Giải Bóng Đá Phủi 2024"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Mô tả giải đấu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                placeholder="Mô tả ngắn về giải đấu..."
                multiline
                numberOfLines={3}
              />
            )}
          />

          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Ngày bắt đầu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.startDate?.message}
                placeholder="YYYY-MM-DD"
              />
            )}
          />

          <Controller
            control={control}
            name="endDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Ngày kết thúc"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.endDate?.message}
                placeholder="YYYY-MM-DD"
              />
            )}
          />
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin giải đấu</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Thể thức</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {league?.type === 'round-robin' ? 'Vòng tròn' : 'Chia bảng'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Số đội</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {league?.numberOfTeams}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Trạng thái</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {league?.tournamentStatus === 'upcoming' ? 'Sắp diễn ra' :
                 league?.tournamentStatus === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Hiển thị</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {league?.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
            * Thể thức và số đội không thể thay đổi sau khi tạo giải đấu
          </Text>
        </View>

        <View style={styles.submitSection}>
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={loading || updateMutation.isPending}
            loading={loading || updateMutation.isPending}
          >
            {loading || updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </Button>
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
  logoSection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 15,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  logoButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  logoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 20,
    gap: 20,
  },
  infoSection: {
    padding: 20,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoNote: {
    fontSize: 12,
    marginTop: 15,
    fontStyle: 'italic',
  },
  submitSection: {
    padding: 20,
    paddingBottom: 40,
  },
});