# 🔐 HƯỚNG DẪN XỬ LÝ TOKEN & AUTHENTICATION

## ⏰ Token Lifetime

- **Access Token**: 15 phút
- **Refresh Token**: 7 ngày

## 🛡️ Cách phòng tránh lỗi 403

### 1. **Auto-refresh token trước khi hết hạn**

Thêm logic tự động refresh token sau **14 phút** (trước khi hết hạn 1 phút):

```typescript
// hooks/useTokenRefresh.ts
import { useEffect } from 'react';
import { authService } from '@/services/auth';

export const useTokenRefresh = () => {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await authService.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, []);
};
```

**Sử dụng trong _layout.tsx**:
```typescript
// app/_layout.tsx
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  useTokenRefresh(); // Auto refresh every 14 minutes
  
  // ... rest of code
}
```

---

### 2. **Interceptor đã xử lý auto-refresh**

File `services/api.ts` đã có logic tự động:
- ✅ Nhận 401 → Auto refresh token
- ✅ Refresh thành công → Retry request
- ✅ Refresh fail → Clear tokens & logout

---

### 3. **Thêm error boundary cho toàn app**

```typescript
// components/AuthErrorBoundary.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function useAuthErrorHandler() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          await logout();
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuthStatus();
  }, []);
}
```

---

## 🔄 Best Practices

### ✅ DO (Nên làm):
1. **Luôn kiểm tra token trước khi gọi API quan trọng**
2. **Show loading state** khi đang refresh token
3. **Clear sensitive data** khi logout
4. **Redirect ngay** về login page khi 403
5. **Log errors** để debug dễ dàng

### ❌ DON'T (Không nên):
1. Không lưu password vào AsyncStorage
2. Không retry quá nhiều lần khi 403
3. Không ignore error messages từ backend
4. Không để user stuck khi token hết hạn

---

## 🐛 Debug Tips

### Check token còn hạn không:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

const checkTokenExpiry = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    const decoded = jwtDecode(token);
    const expiryTime = new Date(decoded.exp * 1000);
    console.log('Token expires at:', expiryTime);
    console.log('Time remaining:', expiryTime - new Date());
  }
};
```

### View all tokens:
```typescript
const debugTokens = async () => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  console.log('Access Token:', accessToken?.substring(0, 50) + '...');
  console.log('Refresh Token:', refreshToken?.substring(0, 50) + '...');
};
```

---

## 📱 User Experience

### Khi token hết hạn:
1. ✅ **Show alert** với message rõ ràng
2. ✅ **Auto logout** để clear state
3. ✅ **Redirect** về login page
4. ✅ **Optional**: Lưu intended route để redirect back sau khi login

```typescript
// Save intended route
await AsyncStorage.setItem('intendedRoute', '/create-league');

// After login success
const intendedRoute = await AsyncStorage.getItem('intendedRoute');
if (intendedRoute) {
  router.push(intendedRoute);
  await AsyncStorage.removeItem('intendedRoute');
}
```

---

## 🔒 Security Notes

1. **Never log full tokens** trong production
2. **Use HTTPS** cho tất cả API calls
3. **Clear tokens on logout**
4. **Validate token format** trước khi use
5. **Handle edge cases**: network errors, server down, etc.

---

## 📚 Related Files

- `services/api.ts` - Axios interceptors
- `services/auth.ts` - Auth API calls
- `contexts/AuthContext.tsx` - Auth state management
- `app/_layout.tsx` - Protected routes logic
- `app/(tabs)/create-league.tsx` - Error handling example
