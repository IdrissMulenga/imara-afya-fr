package expo.modules.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads Android's hardware step counter (TYPE_STEP_COUNTER): a running total of
// steps since the phone booted, counted by the sensor even while the app is closed.
class StepCounterModule : Module() {
  private val sensorManager: SensorManager?
    get() = appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  override fun definition() = ModuleDefinition {
    Name("StepCounter")

    Function("isAvailable") {
      sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    // Resolves { steps, bootTime } from one sensor event, or null if none arrives
    // within timeoutMs. bootTime (ms since epoch) changes after a reboot, when the
    // counter restarts from 0.
    AsyncFunction("readAsync") { timeoutMs: Int, promise: Promise ->
      val manager = sensorManager
      val sensor = manager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
      if (manager == null || sensor == null) {
        promise.resolve(null)
        return@AsyncFunction
      }

      val handler = Handler(Looper.getMainLooper())
      var settled = false
      lateinit var listener: SensorEventListener
      lateinit var timeout: Runnable

      fun settle(result: Map<String, Double>?) {
        if (settled) return
        settled = true
        manager.unregisterListener(listener)
        handler.removeCallbacks(timeout)
        promise.resolve(result)
      }

      listener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          val bootTime = System.currentTimeMillis() - SystemClock.elapsedRealtime()
          settle(mapOf("steps" to event.values[0].toDouble(), "bootTime" to bootTime.toDouble()))
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
      }
      timeout = Runnable { settle(null) }

      handler.post {
        manager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL, 0, handler)
        handler.postDelayed(timeout, timeoutMs.toLong())
      }
    }
  }
}
