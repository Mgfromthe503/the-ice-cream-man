// Root build.gradle.kts - Ensure BillingClient is available to all modules
plugins {
    id("com.android.application") version "8.1.0" apply false
}

subprojects {
    afterEvaluate {
        if (project.name == "app") {
            dependencies {
                add("implementation", "com.android.billingclient:billing:9.1.0")
            }
        }
    }
}
