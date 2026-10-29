package ir.akhavandp.paperfighters;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Full-screen WebView around the hosted game. The game itself (and its
 * service worker) lives on the server, so updates need no new APK.
 */
public class MainActivity extends Activity {
    private static final String HOST = "game.akhavandp.ir";
    private static final String URL = "https://" + HOST + "/";

    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFFF3EFE6);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); // music can start right away
        s.setUserAgentString(s.getUserAgentString() + " PaperFightersApp/" + BuildConfig.VERSION_NAME);
        web.setWebViewClient(new Client());
        setContentView(web);
        immersive();

        if (state != null) web.restoreState(state);
        else web.loadUrl(URL);
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri uri = req.getUrl();
            if (HOST.equals(uri.getHost())) return false;
            // anything else (links, the APK download, ...) opens outside the app
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame()) showOffline();
        }
    }

    private void showOffline() {
        String html = "<!doctype html><html dir=rtl><head><meta charset=utf-8>"
                + "<meta name=viewport content='width=device-width,initial-scale=1'>"
                + "<style>body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;"
                + "justify-content:center;background:#f3efe6;color:#1d1c1a;font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}"
                + "h1{font-size:24px;margin:0 0 8px}p{opacity:.75;margin:0 0 20px;line-height:1.8}"
                + "a{font-weight:900;font-size:18px;color:#f3efe6;background:#1d1c1a;border-radius:12px;padding:10px 26px;text-decoration:none}</style>"
                + "</head><body><h1>اینترنت وصل نیست</h1>"
                + "<p>برای اولین اجرا، جنگجوهای کاغذی به اینترنت نیاز دارد.</p>"
                + "<a href='" + URL + "'>تلاش دوباره</a></body></html>";
        web.loadDataWithBaseURL(URL, html, "text/html", "utf-8", URL);
    }

    private void immersive() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(android.view.WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    @Override
    protected void onPause() {
        // tell the game to pause and stop the music while the app is in the background
        web.evaluateJavascript("window.appPause&&appPause()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.evaluateJavascript("window.appResume&&appResume()", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
            return;
        }
        new AlertDialog.Builder(this)
                .setMessage("از بازی خارج می‌شی؟")
                .setPositiveButton("آره", (d, w) -> finish())
                .setNegativeButton("نه", null)
                .show();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
