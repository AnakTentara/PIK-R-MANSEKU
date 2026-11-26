package org.pikrmanseku.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class NotificationPollWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    override fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("flutter.pikr_device_id", null)
        if (deviceId.isNullOrBlank()) {
            return Result.success()
        }

        val since = prefs.getString("flutter.pikr_last_poll_since", null)
        val rawSeen = prefs.getString("flutter.pikr_seen_notif_json", "[]") ?: "[]"
        val seenList = mutableListOf<String>()
        try {
            val arr = JSONArray(rawSeen)
            for (i in 0 until arr.length()) {
                seenList.add(arr.optString(i))
            }
        } catch (_: Exception) {
        }
        val seenSet = seenList.toMutableSet()

        return try {
            val queryBuilder = StringBuilder("https://pikr-manseku.my.id/api/push/app/pending?deviceId=")
            queryBuilder.append(URLEncoder.encode(deviceId, "UTF-8"))
            if (!since.isNullOrBlank()) {
                queryBuilder.append("&since=").append(URLEncoder.encode(since, "UTF-8"))
            }

            val conn = (URL(queryBuilder.toString()).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/json")
            }

            if (conn.responseCode != 200) {
                conn.disconnect()
                return Result.retry()
            }

            val body = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()

            val json = JSONObject(body)
            val items = json.optJSONArray("items") ?: JSONArray()
            val serverTime = json.optString("serverTime", "")

            if (items.length() > 0) {
                ensureChannel()
                for (i in 0 until items.length()) {
                    val item = items.optJSONObject(i) ?: continue
                    val id = item.optString("id", "")
                    if (id.isBlank() || seenSet.contains(id)) continue

                    val title = item.optString("title", "Ruang Cerita")
                    val message = item.optString("body", "")
                    val url = item.optString("url", "/")
                    val category = item.optString("category", "UMUM")

                    showNativeNotification(id, title, message, url, category)
                    seenSet.add(id)
                    seenList.add(id)
                }
            }

            val trimmed = if (seenList.size > 150) seenList.takeLast(150) else seenList
            val newSeenArr = JSONArray()
            for (id in trimmed) newSeenArr.put(id)

            prefs.edit().apply {
                putString("flutter.pikr_seen_notif_json", newSeenArr.toString())
                if (serverTime.isNotBlank()) {
                    putString("flutter.pikr_last_poll_since", serverTime)
                }
                apply()
            }

            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Pengumuman & Info Ruang Cerita",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifikasi resmi dari aplikasi Ruang Cerita PIK-R MANSEKU"
                enableVibration(true)
            }
            nm.createNotificationChannel(channel)
        }
    }

    private fun showNativeNotification(
        id: String,
        title: String,
        body: String,
        targetUrl: String,
        category: String
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                applicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            action = "org.pikrmanseku.app.OPEN_URL"
            putExtra("target_url", targetUrl)
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val notifId = id.hashCode() and 0x7FFFFFFF
        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            notifId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val largeIcon = BitmapFactory.decodeResource(applicationContext.resources, R.mipmap.ic_launcher)

        val builder = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_pikr)
            .setLargeIcon(largeIcon)
            .setColor(0xFFF97316.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        if (category == "RUANG_CERITA") {
            builder.setGroup("ruang_cerita_group")
        }

        NotificationManagerCompat.from(applicationContext).notify(notifId, builder.build())
    }

    companion object {
        private const val CHANNEL_ID = "pikr_ruang_cerita_broadcast"
    }
}
