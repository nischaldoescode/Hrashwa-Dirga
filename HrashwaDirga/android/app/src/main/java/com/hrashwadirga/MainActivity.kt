package com.hrashwadirga

import android.graphics.drawable.Animatable
import android.os.Bundle
import android.widget.ImageView
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen


class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  override fun getMainComponentName(): String = "HrashwaDirga"

  /**
   * onCreate - Called when the activity is first created
   * 
   * Critical Steps:
   * 1. Switch from SplashTheme to AppTheme BEFORE super.onCreate()
   *    This prevents the default white screen flash
   * 2. Show react-native-splash-screen library splash
   *    This gives us programmatic control over when to hide it
   * 3. Call super.onCreate() to initialize React Native
   */
      override fun onCreate(savedInstanceState: Bundle?) {
        // Show splash screen - it will display launch_screen.xml drawable
        SplashScreen.show(this, R.style.SplashTheme, true)
        
        super.onCreate(savedInstanceState)
        // React Native takes over from here
      }


  /**
   * Returns the instance of the [ReactActivityDelegate].
   * We use [DefaultReactActivityDelegate] which allows you to enable
   * New Architecture with a single boolean flag [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
