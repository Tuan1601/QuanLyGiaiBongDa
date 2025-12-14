import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function HelpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqItems = [
    {
      id: '1',
      question: 'Làm thế nào để tạo giải đấu mới?',
      answer: 'Vào tab "Tạo giải", điền thông tin giải đấu và chọn thể thức thi đấu. Bạn có thể chọn vòng tròn hoặc chia bảng tùy theo số đội tham gia.',
    },
    {
      id: '2',
      question: 'Cách thêm đội vào giải đấu?',
      answer: 'Trong trang chi tiết giải đấu, chọn "Quản lý đội" > "Thêm đội". Nhập thông tin đội bóng và logo nếu có.',
    },
    {
      id: '3',
      question: 'Làm sao để tạo lịch thi đấu?',
      answer: 'Sau khi thêm đủ số đội, vào "Quản lý trận" > "Tạo lịch thi đấu". Hệ thống sẽ tự động tạo lịch dựa trên thể thức đã chọn.',
    },
    {
      id: '4',
      question: 'Cách cập nhật kết quả trận đấu?',
      answer: 'Chọn trận đấu cần cập nhật > "Cập nhật kết quả". Nhập tỷ số và hệ thống sẽ tự động tính điểm, bảng xếp hạng.',
    },
    {
      id: '5',
      question: 'Tôi quên mật khẩu, phải làm sao?',
      answer: 'Ở màn hình đăng nhập, chọn "Quên mật khẩu". Nhập email đã đăng ký và làm theo hướng dẫn trong email.',
    },
    {
      id: '6',
      question: 'Làm thế nào để chia sẻ giải đấu riêng tư?',
      answer: 'Trong cài đặt giải đấu, chọn "Chia sẻ mã truy cập". Gửi mã này cho người khác để họ có thể xem giải đấu.',
    },
  ];

  const contactItems = [
    {
      title: 'Email hỗ trợ',
      value: 'support@bongdaphui.com',
      icon: 'mail-outline',
      onPress: () => Linking.openURL('mailto:support@bongdaphui.com'),
    },
    {
      title: 'Hotline',
      value: '1900 1234',
      icon: 'call-outline',
      onPress: () => Linking.openURL('tel:19001234'),
    },
    {
      title: 'Website',
      value: 'www.bongdaphui.com',
      icon: 'globe-outline',
      onPress: () => Linking.openURL('https://www.bongdaphui.com'),
    },
    {
      title: 'Facebook',
      value: 'Bóng Đá Phủi',
      icon: 'logo-facebook',
      onPress: () => Linking.openURL('https://facebook.com/bongdaphui'),
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const sendFeedback = () => {
    Alert.alert(
      'Gửi phản hồi',
      'Bạn sẽ được chuyển đến ứng dụng email để gửi phản hồi.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Tiếp tục', 
          onPress: () => Linking.openURL('mailto:feedback@bongdaphui.com?subject=Phản hồi ứng dụng')
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Trợ giúp',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Câu hỏi thường gặp
          </Text>
          
          <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
            {faqItems.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={[
                    styles.faqItem,
                    index < faqItems.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => toggleFAQ(item.id)}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>
                    {item.question}
                  </Text>
                  <Ionicons
                    name={expandedFAQ === item.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                
                {expandedFAQ === item.id && (
                  <View style={[styles.faqAnswer, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                      {item.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Liên hệ hỗ trợ
          </Text>
          
          <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
            {contactItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.contactItem,
                  index < contactItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={item.onPress}
              >
                <View style={styles.contactLeft}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={colors.primary} 
                  />
                  <View style={styles.contactText}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.textSecondary }]}>
                      {item.value}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: colors.primary }]}
            onPress={sendFeedback}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.feedbackButtonText}>Gửi phản hồi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            Phiên bản: 1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            Cập nhật lần cuối: 14/12/2024
          </Text>
        </View>
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
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    marginLeft: 16,
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 4,
  },
});