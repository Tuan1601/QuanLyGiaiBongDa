# 🐛 BUG FIXES - Create League Screen

## Ngày: 2025-12-13

### ❌ Các lỗi đã sửa:

#### **1. Lỗi 403 - Access Forbidden**
**Nguyên nhân**: Token xác thực đã hết hạn (access token có hiệu lực 15 phút)

**Giải pháp**:
- Thêm logic **tự động logout** khi nhận được lỗi 403
- Hiển thị alert thông báo rõ ràng
- Redirect user về trang login ngay lập tức
- Dọn dẹp tokens trong AsyncStorage

**Code thay đổi**:
```typescript
// Trong create-league.tsx
if (error.message === 'Access forbidden' || error.response?.status === 403) {
  await logout(); // Auto logout
  Alert.alert(
    'Phiên đăng nhập hết hạn',
    'Vui lòng đăng nhập lại để tiếp tục',
    [{ text: 'OK', onPress: () => router.replace('/login') }]
  );
  return;
}
```

---

#### **2. Lỗi 400 - Validation Failed**
**Backend báo sai**: "Số đội (6) phải bằng số bảng (2) x số đội/bảng (3)"
- Thực tế: 2 × 3 = 6 ✅ (đúng!)

**Nguyên nhân**: 
- Frontend đang gửi đúng dữ liệu
- Format FormData đúng theo docs
- Có thể do backend đang validate không chính xác

**Cải thiện error handling**:
```typescript
// Hiển thị chi tiết errors từ backend
if (error.response?.status === 400) {
  if (error.response?.data?.errors?.length > 0) {
    errorMessage = error.response.data.errors.join('\n');
  } else {
    errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
  }
}
```

---

### ✅ Các cải thiện khác:

1. **Import useAuth** để sử dụng logout function
2. **Better error messages** - Hiển thị chi tiết lỗi từ backend
3. **Format đúng theo docs**: `groupSettings[numberOfGroups]` và `groupSettings[teamsPerGroup]`

---

### 🔍 Cách test:

#### **Test lỗi 403**:
1. Login vào app
2. Đợi 15 phút (hoặc backend clear token)
3. Thử tạo giải đấu mới
4. ✅ Sẽ tự động logout và redirect về login

#### **Test validation**:
1. Login lại
2. Chọn "Chia bảng"
3. Số đội: 6
4. Số bảng: 2
5. Số đội/bảng: 3
6. ⚠️ Nếu vẫn lỗi 400 → Cần kiểm tra backend validation logic

---

### 📝 Lưu ý:

- **Token lifetime**: 15 phút
- **Refresh token**: 7 ngày
- Nếu vẫn gặp validation error → Cần report lên backend team
- Backend có thể đang kiểm tra validation không chính xác

---

### 🔄 Next Steps (nếu vẫn lỗi 400):

1. **Check backend logs** để xem validation logic
2. **Test với Postman** để confirm backend behavior
3. **Có thể cần contact backend team** để fix validation
4. Thử test với số khác: VD 12 đội = 3 bảng × 4 đội/bảng

---

**File đã thay đổi**:
- `app/(tabs)/create-league.tsx`
