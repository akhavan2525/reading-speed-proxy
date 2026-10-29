// "Light" Android app: a full-screen WebView around https://game.akhavandp.ir,
// so game updates reach phones instantly without a new APK.
plugins {
    id("com.android.application")
}

val keystoreFile = System.getenv("APK_KEYSTORE")
val keystorePassword = System.getenv("APK_KEY_PASSWORD")

android {
    namespace = "ir.akhavandp.paperfighters"
    compileSdk = 35

    defaultConfig {
        applicationId = "ir.akhavandp.paperfighters"
        minSdk = 24
        targetSdk = 35
        versionCode = (System.getenv("APK_VERSION_CODE") ?: "1").toInt()
        versionName = System.getenv("APK_VERSION_NAME") ?: "1.0"
    }

    signingConfigs {
        if (keystoreFile != null && keystorePassword != null) {
            create("release") {
                storeFile = file(keystoreFile)
                storePassword = keystorePassword
                keyAlias = "paperfighters"
                keyPassword = keystorePassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            signingConfig = signingConfigs.findByName("release")
        }
    }

    lint {
        checkReleaseBuilds = false
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
