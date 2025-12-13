import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          }
        },
      ]
    );
  };

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const response = await authService.updateProfile(formData);
        updateUser(response.user);
        Alert.alert('Thành công', 'Cập nhật avatar thành công');
      } catch (error: any) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật avatar');
      } finally {
        setUploading(false);
      }
    }
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Chỉnh sửa thông tin',
      icon: 'person-outline',
      color: colors.primary,
      onPress: () => router.push('/profile/edit' as any),
    },
    {
      id: 'change-password',
      title: 'Đổi mật khẩu',
      icon: 'lock-closed-outline',
      color: colors.primary,
      onPress: () => router.push('/profile/change-password' as any),
    },
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: 'settings-outline',
      color: colors.primary,
      onPress: () => router.push('/profile/settings' as any),
    },
    {
      id: 'help',
      title: 'Trợ giúp',
      icon: 'help-circle-outline',
      color: colors.primary,
      onPress: () => router.push('/profile/help' as any),
    },
    {
      id: 'logout',
      title: 'Đăng xuất',
      icon: 'log-out-outline',
      color: colors.lose,
      onPress: handleLogout,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={(colors.gradient?.primary as unknown as readonly [string, string, ...string[]]) || ([colors.primary, colors.primary] as unknown as readonly [string, string, ...string[]])}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <TouchableOpacity 
          onPress={handleChangeAvatar} 
          style={styles.avatarContainer}
          disabled={uploading}>
          
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={50} color="#FFFFFF" />
            </View>
          )}
          
          <View style={styles.cameraIcon}>
            {uploading ? (
              <Ionicons name="hourglass" size={16} color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={item.onPress}>
            
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
              <Text style={[
                styles.menuText, 
                { color: item.id === 'logout' ? item.color : colors.text }
              ]}>
                {item.title}
              </Text>
            </View>
            
            {item.id !== 'logout' && (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colors.textSecondary || colors.icon} 
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.textSecondary || colors.icon }]}>
          Bóng Đá Phủi v1.0.0
        </Text>
        <Text style={[styles.appInfoText, { color: colors.textSecondary || colors.icon }]}>
          © 2024 Football League Management
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menu: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});