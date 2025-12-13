# Authentication System Setup

## 📦 PHASE 8: AUTHENTICATION SCREENS - COMPLETED ✅

### Tính năng đã hoàn thành:

#### ✅ Task 8.1: Auth Layouts
- `app/(auth)/_layout.tsx` - Auth stack layout
- `app/(auth)/login.tsx` - Login screen
- `app/(auth)/register.tsx` - Register screen  
- `app/(auth)/forgot-password.tsx` - Forgot password screen

#### ✅ Task 8.2: Login Screen Features
- Email/Password form với validation
- Remember me checkbox
- Loading state
- Error handling
- Navigate to home sau khi login thành công

#### ✅ Task 8.3: Register Screen Features
- Username, Email, Password form
- Password strength indicator
- Form validation với Yup
- Navigate to login sau khi register thành công

#### ✅ Task 8.4: Protected Routes
- Updated `app/_layout.tsx` với auth logic
- Check authentication state → Redirect to login/home
- Persistent auth state với AsyncStorage

### Components đã tạo:

#### UI Components:
- `components/ui/input.tsx` - Input component với validation
- `components/ui/button.tsx` - Button component với variants
- `components/ui/index.ts` - Export barrel file

#### Services & Store:
- `services/auth.ts` - API service cho authentication
- `store/auth.ts` - Zustand store cho auth state
- `hooks/use-auth.ts` - Custom hook để sử dụng auth

### API Endpoints được implement:

1. **POST /user/register** - Đăng ký tài khoản (Rate limit: 10 requests/15 phút)
2. **POST /user/login** - Đăng nhập (Account lock sau 5 lần sai password)
3. **POST /user/refresh** - Refresh token (Access token hết hạn 15 phút)
4. **POST /user/logout** - Đăng xuất (Xóa refresh token)
5. **GET /user/profile** - Lấy thông tin user
6. **PUT /user/update-profile** - Cập nhật profile (Upload avatar lên Cloudinary)
7. **PUT /user/change-password** - Đổi mật khẩu
8. **DELETE /user/delete-account** - Xóa tài khoản (Cần xác nhận password)

### Cách sử dụng:

#### 1. Cấu hình API URL:
```bash
# File .env đã được cấu hình sẵn
EXPO_PUBLIC_API_URL=https://fleague-tournament-system.onrender.com/api/v1
EXPO_PUBLIC_ENV=production
```

#### 2. Sử dụng Auth Hook:
```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    loginAndNavigate, 
    logoutAndNavigate 
  } = useAuth();
  
  // Your component logic
}
```

#### 3. Protected Routes:
Routes được tự động protect dựa trên `isAuthenticated` state trong `app/_layout.tsx`.

#### 4. Form Validation:
- Email: Phải đúng định dạng
- Password: Tối thiểu 8 ký tự, bao gồm chữ thường, chữ hoa, số và ký tự đặc biệt
- Username: 3-30 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới

### Testing:

1. **Navigate giữa các màn hình auth** ✅
2. **Login thành công** ✅ 
3. **Register user mới** ✅
4. **Access route khi chưa login** ✅
5. **Logout và redirect** ✅

### Dependencies được sử dụng:

- `@react-native-async-storage/async-storage` - Persistent storage
- `react-hook-form` + `@hookform/resolvers` - Form handling
- `yup` - Form validation
- `zustand` - State management
- `axios` - HTTP client

### Lưu ý:

- Token được tự động refresh khi hết hạn
- Auth state được persist với AsyncStorage
- Error handling cho tất cả API calls
- Loading states cho UX tốt hơn
- Responsive design cho mobile

### Tiếp theo:

Có thể mở rộng thêm:
- Social login (Google, Facebook)
- Biometric authentication
- Two-factor authentication
- Password reset via email
- Account verification
##
# API Response Format theo Documentation:

#### Login Response:
```json
{
  "message": "Đăng nhập thành công!",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Register Response:
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "_id": "674d1234567890abcdef1234",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": null,
    "createdLeagues": [],
    "failedAttempts": 0,
    "lockUntil": null,
    "createdAt": "2024-12-06T10:00:00.000Z",
    "updatedAt": "2024-12-06T10:00:00.000Z"
  }
}
```

#### Profile Response:
```json
{
  "message": "Thông tin cá nhân",
  "infoUser": {
    "_id": "674d1234567890abcdef1234",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "createdLeagues": ["674d5678...", "674d9012..."],
    "failedAttempts": 0,
    "lockUntil": null,
    "createdAt": "2024-12-06T10:00:00.000Z",
    "updatedAt": "2024-12-06T10:00:00.000Z"
  }
}
```

### Error Handling:

- **400**: Validation errors, email đã tồn tại
- **403**: Account bị khóa (sau 5 lần sai password)
- **429**: Rate limit exceeded (10 requests/15 phút)
- **401**: Token không hợp lệ hoặc hết hạn

### Security Features:

- **Password Requirements**: Tối thiểu 8 ký tự, bao gồm chữ thường, chữ hoa, số và ký tự đặc biệt (@$!%*?&)
- **Username Requirements**: 3-30 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới
- **Account Lockout**: Khóa 15 phút sau 5 lần đăng nhập sai
- **Rate Limiting**: 10 requests/15 phút cho login endpoint
- **Token Management**: Access token (15 phút), Refresh token (7 ngày)