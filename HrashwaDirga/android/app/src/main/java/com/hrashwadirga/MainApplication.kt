package com.hrashwadirga

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.reactnativerestart.RestartPackage;
// Import SplashScreen package (react-native-splash-screen)
import org.devio.rn.splashscreen.SplashScreenReactPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())

          // Manually add SplashScreenReactPackage for splash screen functionality
          add(SplashScreenReactPackage())

          add(RestartPackage())
        },
    )
  }

  /**
   * Application startup entry point.
   * Initializes React Native host and loads native modules.
   */
  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
