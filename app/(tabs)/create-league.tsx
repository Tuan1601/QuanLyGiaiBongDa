import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { leagueService } from '@/services/league';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateLeagueScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<any>(null);
  const [type, setType] = useState<'round-robin' | 'group-stage'>('round-robin');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [numberOfTeams, setNumberOfTeams] = useState('6');
  const [numberOfGroups, setNumberOfGroups] = useState('2');
  const [teamsPerGroup, setTeamsPerGroup] = useState('3');

  const handleTeamsChange = (value: string) => {
    setNumberOfTeams(value);
    if (type === 'group-stage') {
      const teams = parseInt(value) || 0;
      const groups = parseInt(numberOfGroups) || 1;
      if (teams > 0 && groups > 0) {
        const perGroup = Math.floor(teams / groups);
        if (perGroup >= 2) {
          setTeamsPerGroup(String(perGroup));
        }
      }
    }
  };

  const handleGroupsChange = (value: string) => {
    setNumberOfGroups(value);
    if (type === 'group-stage') {
      const teams = parseInt(numberOfTeams) || 0;
      const groups = parseInt(value) || 1;
      if (teams > 0 && groups > 0) {
        const perGroup = Math.floor(teams / groups);
        if (perGroup >= 2) {
          setTeamsPerGroup(String(perGroup));
        }
      }
    }
  };
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên giải đấu');
      return;
    }

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tạo giải đấu');
      return;
    }

    const totalTeams = Number(numberOfTeams);
    const groups = Number(numberOfGroups);
    const perGroup = Number(teamsPerGroup);

    if (type === 'group-stage') {
      console.log('Final validation before submit:', {
        totalTeams,
        groups,
        perGroup,
        calculation: groups * perGroup,
        isValid: groups * perGroup === totalTeams
      });

      if (groups * perGroup !== totalTeams) {
        Alert.alert(
          'Lỗi cài đặt bảng đấu',
          `Số đội không khớp: ${groups} × ${perGroup} = ${groups * perGroup}, nhưng bạn chọn ${totalTeams}`
        );
        return;
      }

      if (groups < 2) {
        Alert.alert('Lỗi', 'Giải chia bảng phải có ít nhất 2 bảng');
        return;
      }

      if (perGroup < 2) {
        Alert.alert('Lỗi', 'Mỗi bảng phải có ít nhất 2 đội');
        return;
      }
    }

    let payload: FormData | object;

    if (logo) {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('type', type);
      formData.append('visibility', visibility);
      formData.append('numberOfTeams', String(totalTeams));

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (type === 'group-stage') {
        formData.append('groupSettings', JSON.stringify({
          numberOfGroups: groups,
          teamsPerGroup: perGroup
        }));
      }

      if (startDate) formData.append('startDate', startDate);
      if (endDate) formData.append('endDate', endDate);

      formData.append('logo', {
        uri: logo.uri,
        name: 'logo.jpg',
        type: 'image/jpeg',
      } as any);

      payload = formData;
    } else {
      const jsonPayload: any = {
        name: name.trim(),
        type,
        visibility,
        numberOfTeams: totalTeams,
      };

      if (description.trim()) {
        jsonPayload.description = description.trim();
      }

      if (type === 'group-stage') {
        jsonPayload.groupSettings = {
          numberOfGroups: groups,
          teamsPerGroup: perGroup
        };
      }

      if (startDate) jsonPayload.startDate = startDate;
      if (endDate) jsonPayload.endDate = endDate;

      payload = jsonPayload;
    }

    try {
      setLoading(true);

      console.log('CREATE LEAGUE PAYLOAD:', {
        type,
        name: name.trim(),
        visibility,
        numberOfTeams: type === 'group-stage' ? String(groups * perGroup) : String(totalTeams),
        ...(type === 'group-stage' && {
          'groupSettings[numberOfGroups]': String(groups),
          'groupSettings[teamsPerGroup]': String(perGroup),
        }),
      });

      const response = await leagueService.createLeague(payload);

      Alert.alert(
        'Thành công',
        response.message || 'Tạo giải đấu thành công',
        [
          {
            text: 'OK',
            onPress: () =>
              router.push(`/league/${response.league._id}` as any),
          },
        ]
      );
    } catch (error: any) {
      console.error('League creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Không thể tạo giải đấu';

      if (error.message === 'Access forbidden' || error.response?.status === 403) {
        await logout();
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
        return;
      }

      if (error.message === 'Authentication failed') {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 400) {
        if (error.response?.data?.errors?.length > 0) {
          errorMessage = error.response.data.errors.join('\n');
        } else {
          errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Lỗi tạo giải', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Bước 1: Thông tin cơ bản</Text>

      <Text style={[styles.label, { color: colors.text }]}>Tên giải đấu *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="VD: Giải Bóng Đá Phủi 2024"
        placeholderTextColor={colors.textSecondary || colors.icon}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Mô tả</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
        placeholder="Mô tả về giải đấu"
        placeholderTextColor={colors.textSecondary || colors.icon}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={[styles.label, { color: colors.text }]}>Logo giải đấu</Text>
      <TouchableOpacity
        style={[styles.logoPicker, { borderColor: colors.border }]}
        onPress={handlePickLogo}>
        {logo ? (
          <Text style={[styles.logoText, { color: colors.win }]}>✓ Đã chọn logo</Text>
        ) : (
          <>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary || colors.icon} />
            <Text style={[styles.logoText, { color: colors.textSecondary || colors.icon }]}>Chọn logo</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => setStep(2)}>
        <Text style={styles.buttonText}>Tiếp theo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Bước 2: Thể thức thi đấu</Text>

      <Text style={[styles.label, { color: colors.text }]}>Chọn thể thức *</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            { borderColor: colors.border },
            type === 'round-robin' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setType('round-robin')}>
          <Text style={[
            styles.typeText,
            { color: colors.text },
            type === 'round-robin' && { color: '#fff', fontWeight: '600' }
          ]}>
            Vòng tròn 1 lượt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            { borderColor: colors.border },
            type === 'group-stage' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setType('group-stage')}>
          <Text style={[
            styles.typeText,
            { color: colors.text },
            type === 'group-stage' && { color: '#fff', fontWeight: '600' }
          ]}>
            Chia bảng
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Số đội tham gia *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="6"
        placeholderTextColor={colors.textSecondary || colors.icon}
        value={numberOfTeams}
        onChangeText={handleTeamsChange}
        keyboardType="number-pad"
      />

      {type === 'group-stage' && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Số bảng đấu *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="2"
            placeholderTextColor={colors.textSecondary || colors.icon}
            value={numberOfGroups}
            onChangeText={handleGroupsChange}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: colors.text }]}>Số đội/bảng *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="4"
            placeholderTextColor={colors.textSecondary || colors.icon}
            value={teamsPerGroup}
            onChangeText={setTeamsPerGroup}
            keyboardType="number-pad"
          />

          <View style={styles.validationContainer}>
            <Text style={[styles.hint, { color: colors.textSecondary || colors.icon }]}>
              * Tổng số đội = Số bảng × Số đội/bảng ({numberOfGroups} × {teamsPerGroup} = {parseInt(numberOfGroups) * parseInt(teamsPerGroup)})
            </Text>
            {parseInt(numberOfGroups) * parseInt(teamsPerGroup) === parseInt(numberOfTeams) ? (
              <View style={styles.validationSuccess}>
                <Ionicons name="checkmark-circle" size={16} color={colors.win} />
                <Text style={[styles.validationText, { color: colors.win }]}>Cài đặt hợp lệ</Text>
              </View>
            ) : (
              <View style={styles.validationError}>
                <Ionicons name="warning" size={16} color={colors.lose} />
                <Text style={[styles.validationText, { color: colors.lose }]}>
                  Cần điều chỉnh: {parseInt(numberOfTeams)} đội ≠ {parseInt(numberOfGroups) * parseInt(teamsPerGroup)} đội
                </Text>
                <TouchableOpacity
                  style={[styles.autoFixButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const teams = parseInt(numberOfTeams);
                    const groups = parseInt(numberOfGroups);
                    if (teams > 0 && groups > 0) {
                      const perGroup = Math.floor(teams / groups);
                      setTeamsPerGroup(String(perGroup));
                    }
                  }}>
                  <Text style={styles.autoFixText}>Tự động sửa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.primary }]}
          onPress={() => setStep(1)}>
          <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: colors.primary }]}
          onPress={() => setStep(3)}>
          <Text style={styles.buttonText}>Tiếp theo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Bước 3: Cài đặt</Text>

      <Text style={[styles.label, { color: colors.text }]}>Chế độ hiển thị *</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            { borderColor: colors.border },
            visibility === 'public' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setVisibility('public')}>
          <Text style={[
            styles.typeText,
            { color: colors.text },
            visibility === 'public' && { color: '#fff', fontWeight: '600' }
          ]}>
            Công khai
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            { borderColor: colors.border },
            visibility === 'private' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setVisibility('private')}>
          <Text style={[
            styles.typeText,
            { color: colors.text },
            visibility === 'private' && { color: '#fff', fontWeight: '600' }
          ]}>
            Riêng tư
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Ngày bắt đầu (Tùy chọn)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary || colors.icon}
        value={startDate}
        onChangeText={setStartDate}
      />

      <Text style={[styles.label, { color: colors.text }]}>Ngày kết thúc (Tùy chọn)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary || colors.icon}
        value={endDate}
        onChangeText={setEndDate}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, { borderColor: colors.primary }]}
          onPress={() => setStep(2)}>
          <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { flex: 1, backgroundColor: colors.primary },
            (loading || (type === 'group-stage' && parseInt(numberOfGroups) * parseInt(teamsPerGroup) !== parseInt(numberOfTeams))) && { opacity: 0.6 }
          ]}
          onPress={handleCreate}
          disabled={loading || (type === 'group-stage' && parseInt(numberOfGroups) * parseInt(teamsPerGroup) !== parseInt(numberOfTeams))}>
          <Text style={styles.buttonText}>
            {loading ? 'Đang tạo...' : 'Tạo giải đấu'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={(colors.gradient?.primary as unknown as readonly [string, string, ...string[]]) || ([colors.primary, colors.primary] as unknown as readonly [string, string, ...string[]])}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>⚽ Tạo Giải Đấu Mới</Text>
        <Text style={styles.headerSubtitle}>Bước {step}/3</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <View style={[styles.progressDot, { backgroundColor: colors.border }, step >= 1 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressLine, { backgroundColor: colors.border }, step >= 2 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.border }, step >= 2 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressLine, { backgroundColor: colors.border }, step >= 3 && { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.border }, step >= 3 && { backgroundColor: colors.primary }]} />
        </View>

        <View style={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    flex: 1,
    height: 2,
  },
  form: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  logoPicker: {
    height: 120,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    marginTop: 10,
    fontSize: 14,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  validationContainer: {
    marginBottom: 20,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  autoFixButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  autoFixText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    flex: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});