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
     * If logoUrl is null or fails, displays initials fallback badge in TextView.
     */
    public void loadLogo(ImageView imageView, TextView initialsFallbackView, String logoUrl, String clubName) {
        if (logoUrl == null || logoUrl.trim().isEmpty()) {
            showInitialsFallback(imageView, initialsFallbackView, clubName);
            return;
        }

        // Check cache
        Bitmap cached = memoryCache.get(logoUrl);
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
}
