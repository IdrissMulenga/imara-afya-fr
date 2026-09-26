package expo.modules.sleep

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.android.gms.location.SleepClassifyEvent
import com.google.android.gms.location.SleepSegmentEvent
import org.json.JSONArray
import org.json.JSONObject

// Receives data from Google's Sleep API, even when the app is closed, and stores it until
// the app reads it: sleep segments (sent once, after the user wakes) and classify events
// (about every 10 minutes, a 0-100 confidence that the user is asleep).
class SleepReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (SleepSegmentEvent.hasEvents(intent)) {
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
    if (SleepClassifyEvent.hasEvents(intent)) {
      val events = SleepClassifyEvent.extractEvents(intent)
      synchronized(LOCK) {
        val stored = readClassify(context)
        val seen = stored.map { it.first }.toMutableSet()
        for (event in events) {
          if (seen.add(event.timestampMillis)) stored.add(event.timestampMillis to event.confidence)
        }
        writeClassify(context, stored.sortedBy { it.first }.takeLast(MAX_CLASSIFY))
      }
    }
  }

  companion object {
    private const val PREFS = "imara_sleep"
    private const val KEY = "segments"
    private const val CLASSIFY_KEY = "classify"
    private const val MAX_SEGMENTS = 30
    // About four days of 10-minute readings.
    private const val MAX_CLASSIFY = 600
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
      val result = mutableListOf<Triple<Long, Long, Int>>()
      val array = load(context, KEY)
      for (i in 0 until array.length()) {
        val item = array.optJSONObject(i) ?: continue
        result.add(Triple(item.optLong("start"), item.optLong("end"), item.optInt("status")))
      }
      return result
    }

    // Stored classify readings as (timeMs, confidence 0-100).
    fun readClassify(context: Context): MutableList<Pair<Long, Int>> {
      val result = mutableListOf<Pair<Long, Int>>()
      val array = load(context, CLASSIFY_KEY)
      for (i in 0 until array.length()) {
        val item = array.optJSONObject(i) ?: continue
        result.add(item.optLong("time") to item.optInt("confidence"))
      }
      return result
    }

    private fun load(context: Context, key: String): JSONArray {
      val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key, "[]") ?: "[]"
      return try { JSONArray(raw) } catch (e: Exception) { JSONArray() }
    }

    private fun write(context: Context, segments: List<Triple<Long, Long, Int>>) {
      val array = JSONArray()
      for ((start, end, status) in segments) {
        array.put(JSONObject().put("start", start).put("end", end).put("status", status))
      }
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, array.toString()).apply()
    }

    private fun writeClassify(context: Context, readings: List<Pair<Long, Int>>) {
      val array = JSONArray()
      for ((time, confidence) in readings) {
        array.put(JSONObject().put("time", time).put("confidence", confidence))
      }
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(CLASSIFY_KEY, array.toString()).apply()
    }

    fun clear(context: Context) {
      synchronized(LOCK) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).remove(CLASSIFY_KEY).apply()
      }
    }
  }
}
