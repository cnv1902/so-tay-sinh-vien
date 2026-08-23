import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Giữ lại Splash Screen native cho đến khi app sẵn sàng
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isAppReady, setAppReady] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Nơi đây để tải fonts, assets, data cần thiết khi mở app...
    setAppReady(true);
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Ẩn Splash Screen mặc định của hệ điều hành
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Ứng dụng chính luôn được render ngầm bên dưới */}
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="news/[id]"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="handbook/[id]"
              options={{
                headerShown: false,
              }}
            />
          </Stack>

          {/* Phủ màn hình chờ mượt mà đè lên trên */}
          {!isSplashAnimationComplete && isAppReady && (
            <AnimatedSplashScreen 
              onAnimationFinish={() => setAnimationComplete(true)} 
            />
          )}
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}