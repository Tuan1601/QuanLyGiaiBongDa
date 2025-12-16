import { yupResolver } from '@hookform/resolvers/yup';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as yup from 'yup';
import { AnimatedInput } from '../../components/ui/animated-input';
import { Button } from '../../components/ui/button';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { authService } from '../../services/auth';

const schema = yup.object({
  username: yup.string().required('Tên người dùng là bắt buộc').min(3, 'Tối thiểu 3 ký tự'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
});

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    console.log('✏️ Edit: Starting profile update with data:', data);
    try {
      console.log('📤 Edit: Calling updateProfile API...');
      const response = await authService.updateProfile(data);
      console.log('✅ Edit: API response received:', response);
      console.log('👤 Edit: Updating user state with:', response.user);
      updateUser(response.user);
      console.log('🎉 Edit: User state updated successfully');
      Alert.alert('Thành công', 'Cập nhật thông tin thành công', [
        { text: 'OK', onPress: () => {
          console.log('⬅️ Edit: Navigating back...');
          router.back();
        }}
      ]);
    } catch (error: any) {
      console.error('❌ Edit: Profile update failed:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
      console.log('🏁 Edit: Profile update process finished');
    }
  };

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
        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Tên người dùng"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
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
  form: {
    padding: 20,
    gap: 20,
  },
  submitButton: {
    marginTop: 20,
  },
});