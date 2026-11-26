package org.pikrmanseku.app

import android.content.Intent
import android.os.Bundle
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.concurrent.TimeUnit

class MainActivity : FlutterActivity() {
    private var notifChannel: MethodChannel? = null
    private var initialTargetUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initialTargetUrl = extractTargetUrl(intent)
        scheduleBackgroundPoll()
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        notifChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL_NAME).apply {
            setMethodCallHandler { call, result ->
                when (call.method) {
                    "getInitialTargetUrl" -> {
                        val url = initialTargetUrl
                        initialTargetUrl = null
                        result.success(url)
                    }
                    else -> result.notImplemented()
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val url = extractTargetUrl(intent)
        if (!url.isNullOrBlank()) {
            notifChannel?.invokeMethod("onOpenTargetUrl", url)
        }
    }

    private fun extractTargetUrl(intent: Intent?): String? {
        if (intent == null) return null
        val extraUrl = intent.getStringExtra("target_url")
        if (!extraUrl.isNullOrBlank()) return extraUrl
        val dataUri = intent.data
        return dataUri?.toString()
    }

    private fun scheduleBackgroundPoll() {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<NotificationPollWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
                "pikr_notif_background_poll",
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
        } catch (_: Exception) {
        }
    }

    companion object {
        private const val CHANNEL_NAME = "org.pikrmanseku.app/notifications"
    }
}
