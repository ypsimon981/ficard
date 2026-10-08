package fi.card.app;

import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CardScreen")
public class CardScreenPlugin extends Plugin {
    private Float previousBrightness = null;
    private boolean previousKeepAwake = false;

    @PluginMethod
    public void setFullScreen(PluginCall call) {
        final boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            WindowManager.LayoutParams params = window.getAttributes();
            if (active) {
                if (previousBrightness == null) {
                    previousBrightness = params.screenBrightness;
                    previousKeepAwake = (params.flags & WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) != 0;
                }
                params.screenBrightness = 1.0f;
                window.setAttributes(params);
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                restore();
            }
            call.resolve();
        });
    }

    private void restore() {
        if (previousBrightness == null) return;
        Window window = getActivity().getWindow();
        WindowManager.LayoutParams params = window.getAttributes();
        params.screenBrightness = previousBrightness;
        window.setAttributes(params);
        if (!previousKeepAwake) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        previousBrightness = null;
    }

    @Override
    protected void handleOnPause() {
        restore();
    }
}
