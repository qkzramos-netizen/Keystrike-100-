import React, { createContext, useContext } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const COLORS = {
  background: '#01013a',
  panel: 'rgba(4, 15, 44, 0.82)',
  panelLight: '#102765',
  primary: '#f0d76d',
  text: '#f5f6ff',
  muted: 'rgba(255, 255, 255, 0.74)',
  danger: '#ff9b9b',
};

const BACK_ICON = require('../../public/assets/back.png');
const PageLayoutContext = createContext({ topOffset: 0, leftOffset: 0 });

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 820,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: '700',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 22,
  },
  button: {
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panelLight,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(4, 15, 44, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  buttonTextSecondary: {
    color: COLORS.text,
  },
  back: {
    position: 'absolute',
    top: 20,
    left: 16,
    width: 48,
    height: 48,
    justifyContent: 'center',
    zIndex: 2,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.panel,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginVertical: 6,
  },
  field: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderColor: '#2544cc',
    borderWidth: 1,
    borderRadius: 10,
    color: '#171717',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    marginVertical: 5,
  },
  error: {
    color: COLORS.danger,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 20,
  },
  authPanel: {
    width: '100%',
    maxWidth: 520,
    minHeight: 520,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#010172',
    borderWidth: 2,
    borderRadius: 18,
    padding: 28,
  },
  authTitle: {
    color: '#010172',
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    color: '#000080',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 22,
  },
});


export function Page({
  children,
  scroll = true,
  style,
  contentStyle,
  backgroundImage,
  overlayColor = 'rgba(2, 10, 34, 0.78)',
}) {
  const { width: windowWidth } = useWindowDimensions();
  const pageStyle = StyleSheet.flatten(style) || {};
  const innerContentStyle = StyleSheet.flatten(contentStyle) || {};
  const paddingTop = pageStyle.paddingTop ?? styles.page.paddingTop;
  const paddingLeft = pageStyle.paddingLeft ?? pageStyle.paddingHorizontal ?? styles.page.paddingHorizontal;
  const paddingRight = pageStyle.paddingRight ?? pageStyle.paddingHorizontal ?? styles.page.paddingHorizontal;
  const availableWidth = Math.max(0, windowWidth - paddingLeft - paddingRight);
  const contentWidth = Math.min(availableWidth, innerContentStyle.maxWidth ?? styles.content.maxWidth);
  const contentOffsetX = Math.max(0, (availableWidth - contentWidth) / 2);
  const contentJustification = pageStyle.justifyContent;
  const backButtonLayout = {
    topOffset: 12 - paddingTop,
    leftOffset: 16 - paddingLeft - contentOffsetX,
  };

  const content = (
    <View style={[styles.page, { flexGrow: 1, width: '100%' }, style]}>
      <View
        style={[
          styles.content,
          contentStyle,
          contentJustification
            ? { justifyContent: contentJustification }
            : null,
        ]}
      >
        {children}
      </View>
    </View>
  );

  const pageContent = scroll ? (
    <ScrollView
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
      }}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <View style={{ flex: 1, width: '100%', alignSelf: 'stretch' }}>
      {backgroundImage && (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: overlayColor },
            ]}
          />
        </ImageBackground>
      )}

      <SafeAreaView
        edges={['top', 'bottom']}
        style={[
          styles.safeArea,
          {
            flex: 1,
            width: '100%',
            alignSelf: 'stretch',
            backgroundColor: 'transparent',
          },
        ]}
      >
        <PageLayoutContext.Provider value={backButtonLayout}>
          {pageContent}
        </PageLayoutContext.Provider>
      </SafeAreaView>
    </View>
  );
}


export function BackButton({ onPress, label = '‹  Back', style }) {
  const { topOffset, leftOffset } = useContext(PageLayoutContext);

  return (
    <Pressable accessibilityLabel={label.replace(/[‹›]/g, '').trim()} accessibilityRole="button" onPress={onPress} style={[styles.back, { top: topOffset, left: leftOffset }, style]}>
      <Image source={BACK_ICON} resizeMode="contain" style={{ width: 40, height: 40 }} />
    </Pressable>
  );
}

export function AppButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
  style,
  textStyle,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        style,
        disabled && { opacity: 0.55 },
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function ImageActionButton({
  title,
  image,
  tint,
  imageOpacity = 0.25,
  onPress,
  style,
  textStyle,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: '100%',
          minHeight: 68,
          overflow: 'hidden',
          borderRadius: 10,
          backgroundColor: tint,
          marginVertical: 6,
        },
        style,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <ImageBackground
        source={image}
        resizeMode="cover"
        imageStyle={{ opacity: imageOpacity }}
        style={{ minHeight: 68, justifyContent: 'center' }}
      >
        <Text style={[{
          color: '#ffffff',
          fontFamily: 'Georgia',
          fontSize: 20,
          fontWeight: '700',
          textAlign: 'center',
        }, textStyle]}>
          {title}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}
