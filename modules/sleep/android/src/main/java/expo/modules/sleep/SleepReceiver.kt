package expo.modules.sleep

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.android.gms.location.SleepSegmentEvent
import org.json.JSONArray
import org.json.JSONObject

// Receives sleep segments from Google's Sleep API (delivered after the user wakes,
// even when the app is closed) and stores them until the app reads them.
class SleepReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (!SleepSegmentEvent.hasEvents(intent)) return
    val events = SleepSegmentEvent.extractEvents(intent)
    synchronized(LOCK) {
      val stored = read(context)
      val seen = stored.map { it.first to it.second }.toMutableSet()
      for (event in events) {
        val key = event.startTimeMillis to event.endTimeMillis
        if (seen.add(key)) stored.add(Triple(event.startTimeMillis, event.endTimeMillis, event.status))
      }
      write(context, stored.takeLast(MAX_SEGMENTS))
    }
  }

  companion object {
    private const val PREFS = "imara_sleep"
    private const val KEY = "segments"
    private const val MAX_SEGMENTS = 30
    private val LOCK = Any()

    fun pendingIntent(context: Context): PendingIntent {
      val intent = Intent(context, SleepReceiver::class.java)
      // The system adds the sleep data to this intent, so it must be mutable on Android 12+.
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
      return PendingIntent.getBroadcast(context, 0, intent, flags)
    }

    // Stored segments as (startMs, endMs, status); status 0 means successfully detected.
    fun read(context: Context): MutableList<Triple<Long, Long, Int>> {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]") ?: "[]"
      val array = try { JSONArray(raw) } catch (e: Exception) { JSONArray() }
      val result = mutableListOf<Triple<Long, Long, Int>>()
      for (i in 0 until array.length()) {
        val item = array.optJSONObject(i) ?: continue
        result.add(Triple(item.optLong("start"), item.optLong("end"), item.optInt("status")))
      }
      return result
    }

    private fun write(context: Context, segments: List<Triple<Long, Long, Int>>) {
      val array = JSONArray()
      for ((start, end, status) in segments) {
        array.put(JSONObject().put("start", start).put("end", end).put("status", status))
      }
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, array.toString()).apply()
    }

    fun clear(context: Context) {
      synchronized(LOCK) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
      }
    }
  }
}
