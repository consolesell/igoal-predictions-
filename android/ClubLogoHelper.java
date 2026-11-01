package com.example.igoalpredictions.ui;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;
import android.widget.TextView;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Safe Club Logo Loader & Fallback Manager (Phase 2)
 * Adheres to: "Load logo URLs with cache; fallback to existing Ui.badge initials; no crash if logoUrl null"
 */
public class ClubLogoHelper {
    private static ClubLogoHelper instance;
    private final LruCache<String, Bitmap> memoryCache;
    private final ExecutorService executorService;
    private final Handler mainHandler;

    private ClubLogoHelper() {
        final int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);
        final int cacheSize = maxMemory / 8;
        this.memoryCache = new LruCache<String, Bitmap>(cacheSize) {
            @Override
            protected int sizeOf(String key, Bitmap bitmap) {
                return bitmap.getByteCount() / 1024;
            }
        };
        this.executorService = Executors.newFixedThreadPool(4);
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    public static synchronized ClubLogoHelper getInstance() {
        if (instance == null) {
            instance = new ClubLogoHelper();
        }
        return instance;
    }

    /**
     * Loads club logo into ImageView with memory cache.
     * Automatically dictates logo if logoUrl is missing or null.
     * If neither is available, safely displays initials badge.
     */
    public void loadLogo(ImageView imageView, TextView initialsFallbackView, String logoUrl, String clubName) {
        String resolvedUrl = (logoUrl != null && !logoUrl.trim().isEmpty()) ? logoUrl : dictateLogoUrl(clubName);
        if (resolvedUrl == null || resolvedUrl.trim().isEmpty()) {
            showInitialsFallback(imageView, initialsFallbackView, clubName);
            return;
        }

        // Check cache
        Bitmap cached = memoryCache.get(resolvedUrl);
        if (cached != null) {
            if (imageView != null) {
                imageView.setImageBitmap(cached);
                imageView.setVisibility(android.view.View.VISIBLE);
            }
            if (initialsFallbackView != null) {
                initialsFallbackView.setVisibility(android.view.View.GONE);
            }
            return;
        }
        if (cached != null) {
            if (imageView != null) {
                imageView.setImageBitmap(cached);
                imageView.setVisibility(android.view.View.VISIBLE);
            }
            if (initialsFallbackView != null) {
                initialsFallbackView.setVisibility(android.view.View.GONE);
            }
            return;
        }

        // Async download
        executorService.execute(() -> {
            Bitmap bitmap = null;
            try {
                URL url = new URL(logoUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(6000);
                connection.setReadTimeout(6000);
                connection.setDoInput(true);
                connection.connect();
                if (connection.getResponseCode() == 200) {
                    try (InputStream input = connection.getInputStream()) {
                        bitmap = BitmapFactory.decodeStream(input);
                        if (bitmap != null) {
                            memoryCache.put(logoUrl, bitmap);
                        }
                    }
                }
            } catch (Exception ignored) {
                // Network or decoding failure: fallback safely without crash
            }

            final Bitmap finalBitmap = bitmap;
            mainHandler.post(() -> {
                if (finalBitmap != null && imageView != null) {
                    imageView.setImageBitmap(finalBitmap);
                    imageView.setVisibility(android.view.View.VISIBLE);
                    if (initialsFallbackView != null) {
                        initialsFallbackView.setVisibility(android.view.View.GONE);
                    }
                } else {
                    showInitialsFallback(imageView, initialsFallbackView, clubName);
                }
            });
        });
    }

    private void showInitialsFallback(ImageView imageView, TextView initialsFallbackView, String clubName) {
        if (imageView != null) {
            imageView.setVisibility(android.view.View.GONE);
        }
        if (initialsFallbackView != null) {
            initialsFallbackView.setText(getInitials(clubName));
            initialsFallbackView.setVisibility(android.view.View.VISIBLE);
        }
    }

    public static String getInitials(String name) {
        if (name == null || name.trim().isEmpty()) return "IG";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(3, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }

    /**
     * Dictates club logo URL locally even if misplaced or prefixed (e.g. "FC Arsenal", "Madrid Real", "PSG")
     */
    public static String dictateLogoUrl(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) return null;
        String norm = rawName.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", " ")
            .replaceAll("\\s+", " ")
            .trim();

        // Strip common prefixes/suffixes
        String cleaned = norm.replaceAll("^(fc|afc|sc|ac|as|ss|rc|ca|ud|vfb|vfl|1\\s*fc)\\s+", "")
                             .replaceAll("\\s+(fc|cf|sc|ac|afc|united|city|hotspur|wanderers|albion)$", "")
                             .trim();

        if (cleaned.contains("arsenal")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9825.png";
        if (cleaned.contains("chelsea")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8455.png";
        if (cleaned.contains("manchester city") || cleaned.contains("man city") || (norm.contains("city") && norm.contains("manchester"))) return "https://images.fotmob.com/image_resources/logo/teamlogo/8456.png";
        if (cleaned.contains("liverpool")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8650.png";
        if (cleaned.contains("real madrid") || (norm.contains("madrid") && norm.contains("real"))) return "https://images.fotmob.com/image_resources/logo/teamlogo/8633.png";
        if (cleaned.contains("barcelona") || cleaned.contains("barca")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8634.png";
        if (cleaned.contains("atletico") || cleaned.contains("atleti")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9906.png";
        if (cleaned.contains("inter") || cleaned.contains("internazionale")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8636.png";
        if (cleaned.contains("milan") && !cleaned.contains("inter")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8564.png";
        if (cleaned.contains("juventus") || cleaned.contains("juve")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9885.png";
        if (cleaned.contains("bayern") || (norm.contains("munich") && norm.contains("bayern"))) return "https://images.fotmob.com/image_resources/logo/teamlogo/9823.png";
        if (cleaned.contains("dortmund") || cleaned.contains("bvb")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9789.png";
        if (cleaned.contains("paris") || cleaned.contains("psg")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9847.png";
        if (cleaned.contains("tottenham") || cleaned.contains("spurs")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8586.png";
        if (cleaned.contains("newcastle")) return "https://images.fotmob.com/image_resources/logo/teamlogo/10261.png";
        if (cleaned.contains("aston villa") || cleaned.contains("villa")) return "https://images.fotmob.com/image_resources/logo/teamlogo/10252.png";
        if (cleaned.contains("bournemouth")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8678.png";
        if (cleaned.contains("brighton")) return "https://images.fotmob.com/image_resources/logo/teamlogo/10204.png";
        if (cleaned.contains("wolves") || cleaned.contains("wolverhampton")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8659.png";
        if (cleaned.contains("napoli")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9875.png";
        if (cleaned.contains("roma")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8686.png";
        if (cleaned.contains("lazio")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8543.png";
        if (cleaned.contains("leverkusen")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8178.png";
        if (cleaned.contains("leipzig")) return "https://images.fotmob.com/image_resources/logo/teamlogo/178475.png";
        if (cleaned.contains("marseille")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8592.png";
        if (cleaned.contains("monaco")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9829.png";
        if (cleaned.contains("benfica")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9772.png";
        if (cleaned.contains("sporting")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9768.png";
        if (cleaned.contains("porto")) return "https://images.fotmob.com/image_resources/logo/teamlogo/9773.png";
        if (cleaned.contains("ajax")) return "https://images.fotmob.com/image_resources/logo/teamlogo/8593.png";
        if (cleaned.contains("al hilal") || cleaned.contains("al-hilal")) return "https://images.fotmob.com/image_resources/logo/teamlogo/85906.png";
        if (cleaned.contains("al nassr") || cleaned.contains("al-nassr")) return "https://images.fotmob.com/image_resources/logo/teamlogo/85907.png";
        if (cleaned.contains("inter miami") || cleaned.contains("miami")) return "https://images.fotmob.com/image_resources/logo/teamlogo/1150824.png";

        return null;
    }
}
