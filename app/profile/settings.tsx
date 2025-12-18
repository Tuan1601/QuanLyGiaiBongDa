import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function SettingsScreen() {
  const colors = Colors;
  
  const [settings, setSettings] = useState({
    notifications: true,
    matchReminders: true,
    leagueUpdates: true,
    darkMode: colorScheme === 'dark',
    autoSync: true,
  });

  const updateSetting = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Xóa bộ nhớ đệm',
      'Bạn có chắc chắn muốn xóa tất cả dữ liệu đã lưu trong bộ nhớ đệm?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => key.startsWith('cache_'));
              await AsyncStorage.multiRemove(cacheKeys);
              Alert.alert('Thành công', 'Đã xóa bộ nhớ đệm');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa bộ nhớ đệm');
            }
          }
        }
      ]
    );
  };

  const settingItems = [
    {
      section: 'Thông báo',
      items: [
        {
          key: 'notifications',
          title: 'Thông báo push',
          description: 'Nhận thông báo từ ứng dụng',
          icon: 'notifications-outline',
          type: 'switch',
          value: settings.notifications,
        },
        {
          key: 'matchReminders',
          title: 'Nhắc nhở trận đấu',
          description: 'Thông báo trước khi trận đấu bắt đầu',
          icon: 'time-outline',
          type: 'switch',
          value: settings.matchReminders,
        },
        {
          key: 'leagueUpdates',
          title: 'Cập nhật giải đấu',
          description: 'Thông báo khi có cập nhật mới',
          icon: 'trophy-outline',
          type: 'switch',
          value: settings.leagueUpdates,
        },
      ],
    },
    {
      section: 'Giao diện',
      items: [
        {
          key: 'darkMode',
          title: 'Chế độ tối',
          description: 'Sử dụng giao diện tối',
          icon: 'moon-outline',
          type: 'switch',
          value: settings.darkMode,
        },
      ],
    },
    {
      section: 'Dữ liệu',
      items: [
        {
          key: 'autoSync',
          title: 'Tự động đồng bộ',
          description: 'Đồng bộ dữ liệu khi có kết nối',
          icon: 'sync-outline',
          type: 'switch',
          value: settings.autoSync,
        },
        {
          key: 'clearCache',
          title: 'Xóa bộ nhớ đệm',
          description: 'Xóa dữ liệu tạm thời để giải phóng dung lượng',
          icon: 'trash-outline',
          type: 'action',
          onPress: clearCache,
        },
      ],
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Cài đặt',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {settingItems.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.section}
            </Text>
            
            <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
              {section.items.map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={colors.primary} 
                    />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={(value) => updateSetting(item.key, value)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={item.value ? '#fff' : '#f4f3f4'}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
