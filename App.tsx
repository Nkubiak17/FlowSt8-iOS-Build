 import React from 'react';
import { SafeAreaView, StyleSheet, Platform, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Purchases from 'react-native-purchases';

const App = () => {
  // ⬇️ IMPORTANT: PASTE YOUR REVENUECAT PUBLIC SDK KEY HERE ⬇️
  const REVENUECAT_PUBLIC_KEY = "appl_PcqamvTSBLfuSSxNYiQdaOsHZyH";
  
  const BASE44_APP_URL = "https://flow-st8-146531a1.base44.app";

  // This is the "bridge" code that lets the web app talk to the native app.
  // It creates a `window.FlowSt8Native` object inside the WebView.
  const injectedJavaScript = `
    window.FlowSt8Native = {
      isNativeApp: true,
      platform: '${Platform.OS}',
      
      initializeRevenueCat: async (apiKey, userId) => {
        try {
          if (!userId) {
            console.error('[Native Bridge] RevenueCat requires a User ID to initialize.');
            return { success: false, error: 'User ID is missing.' };
          }
          // We use the REVENUECAT_PUBLIC_KEY defined in the native code, not the one passed from web.
          await Purchases.configure({ apiKey: "${REVENUECAT_PUBLIC_KEY}" });
          await Purchases.logIn(userId);
          return { success: true };
        } catch (e) {
          console.error('[Native Bridge] Failed to initialize RevenueCat:', e);
          return { success: false, error: e.message };
        }
      },

      getOfferings: async () => {
        try {
          const offerings = await Purchases.getOfferings();
          return offerings;
        } catch (e) {
          console.error('[Native Bridge] Failed to get offerings:', e);
          return null;
        }
      },
      
      purchasePackage: async (packageIdentifier) => {
        try {
          const offerings = await Purchases.getOfferings();
          const availablePackages = offerings.current?.availablePackages || [];
          const packageToPurchase = availablePackages.find(p => p.identifier === packageIdentifier);

          if (!packageToPurchase) {
            throw new Error('Package not found.');
          }
          
          const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
          return { success: true, customerInfo };
        } catch (e) {
          if (e.userCancelled) {
            return { success: false, error: { code: 'purchaseCancelled', message: 'Purchase was cancelled by user.' } };
          }
          console.error('[Native Bridge] Purchase failed:', e);
          return { success: false, error: { code: e.code, message: e.message } };
        }
      },

      restorePurchases: async () => {
        try {
          const customerInfo = await Purchases.restorePurchases();
          // Check if the 'pro_access' entitlement is active
          const isPro = customerInfo.entitlements.active.hasOwnProperty('pro_access');
          return { success: true, isPro: isPro };
        } catch (e) {
          console.error('[Native Bridge] Failed to restore purchases:', e);
          return { success: false, error: e.message };
        }
      }
    };
    true; // Must be the last line
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: BASE44_APP_URL }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              color="#8A2BE2" // A purple color matching a potential theme
              size="large"
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // A clean white background
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;