import { yupResolver } from '@hookform/resolvers/yup';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { AnimatedInput } from '../../components/ui/animated-input';
import { Button } from '../../components/ui/button';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { authService } from '../../services/auth';

const schema = yup.object({
  currentPassword: yup.string().required('Mật khẩu hiện tại là bắt buộc'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới là bắt buộc')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/.*[@#$%^&*(),.?":{}|<>].*/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@#$%^&*...)'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp'),
});

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const colors = Colors;

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      Alert.alert(
        'Thành công', 
        'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
        [
          { 
            text: 'OK', 
            onPress: async () => {
              await logout();
              router.replace('/login' as any);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Đổi mật khẩu',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.form}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </Text>

          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Mật khẩu hiện tại"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
                secureTextEntry
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Mật khẩu mới"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
                secureTextEntry
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AnimatedInput
                label="Xác nhận mật khẩu mới"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          >
            {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});
