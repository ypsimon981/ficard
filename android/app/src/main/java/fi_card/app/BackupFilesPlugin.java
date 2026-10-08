package fi_card.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupFiles")
public class BackupFilesPlugin extends Plugin {
    private volatile boolean saving = false;

    @PluginMethod
    public void saveBackup(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("Backup vuoto", "INVALID_DATA");
            return;
        }
        if (saving) {
            call.reject("Un salvataggio è già in corso", "BUSY");
            return;
        }
        saving = true;
        String name = call.getString("name", "fi-card-backup.json").replaceAll("[^a-zA-Z0-9._-]", "_");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(call, intent, "backupDestination");
        } catch (Exception error) {
            saving = false;
            call.reject("Selettore file non disponibile", "PICKER_UNAVAILABLE", error);
        }
    }

    @ActivityCallback
    private void backupDestination(PluginCall call, ActivityResult result) {
        if (call == null) {
            saving = false;
            return;
        }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            saving = false;
            call.reject("Salvataggio annullato", "CANCELLED");
            return;
        }
        execute(() -> {
            try {
                // Close the stream before reporting success, including cloud providers.
                try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "w")) {
                    if (output == null) throw new java.io.IOException("File non accessibile");
                    output.write(call.getString("data", "").getBytes(StandardCharsets.UTF_8));
                    output.flush();
                }
                call.resolve();
            } catch (Exception error) {
                call.reject("Impossibile salvare il backup", "WRITE_FAILED", error);
            } finally {
                saving = false;
            }
        });
    }
}
