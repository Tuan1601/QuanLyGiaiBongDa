import { yupResolver } from '@hookform/resolvers/yup';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as yup from 'yup';

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
});

type ForgotPasswordForm = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      console.log('Forgot password data:', data);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsEmailSent(true);
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return;
    
    setIsLoading(true);
    try {
      console.log('Resend email to:', email);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Thành công', 'Email đã được gửi lại.');
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi lại email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B91C3C', '#DC2626']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          
          <View style={styles.logoContainer}>
            <Text style={styles.emailIcon}>📧</Text>
          </View>
          
          <Text style={styles.appTitle}>Kiểm tra email</Text>
          <Text style={styles.appSubtitle}>Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <View style={styles.emailSentContainer}>
              <Text style={styles.emailSentText}>📧 Email đã được gửi đến:</Text>
              <Text style={styles.emailText}>{getValues('email')}</Text>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>• Kiểm tra hộp thư đến của bạn</Text>
              <Text style={styles.instructionText}>• Nếu không thấy email, hãy kiểm tra thư mục spam</Text>
              <Text style={styles.instructionText}>• Nhấp vào liên kết trong email để đặt lại mật khẩu</Text>
            </View>

            <TouchableOpacity
              style={[styles.resendButton, isLoading && styles.buttonDisabled]}
              onPress={handleResendEmail}
              disabled={isLoading}>
              <Text style={styles.resendButtonText}>
                {isLoading ? 'Đang gửi...' : 'Gửi lại email'}
              </Text>
            </TouchableOpacity>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backToLoginButton}>
                <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header với gradient đỏ */}
      <LinearGradient
        colors={['#B91C3C', '#DC2626']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        {/* Logo key */}
        <View style={styles.logoContainer}>
          <Text style={styles.keyIcon}>🔑</Text>
        </View>
        
        {/* Tiêu đề */}
        <Text style={styles.appTitle}>Quên mật khẩu</Text>
        <Text style={styles.appSubtitle}>Nhập email để nhận hướng dẫn đặt lại mật khẩu</Text>
      </LinearGradient>

      {/* Form container trắng */}
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập email của bạn"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                )}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}>
            <LinearGradient
              colors={['#B91C3C', '#DC2626']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Đang gửi...' : 'Gửi hướng dẫn 📧'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Nhớ mật khẩu rồi? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailIcon: {
    fontSize: 50,
  },
  keyIcon: {
    fontSize: 50,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#B91C3C',
    fontWeight: '600',
  },
  emailSentContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(185, 28, 60, 0.1)',
    marginBottom: 20,
  },
  emailSentText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B91C3C',
  },
  instructions: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  resendButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B91C3C',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B91C3C',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#6B7280',
  },
});