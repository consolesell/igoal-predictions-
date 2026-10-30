package com.example.igoalpredictions.sync;

import android.content.Context;
import android.util.Log;
import com.example.igoalpredictions.network.BackendClient;
import java.io.IOException;
import java.util.List;

/**
 * Worker / Sync Manager for iGoal Predictions Android App
 * Coordinates syncing fixtures, prediction tips, and settlement outcomes.
 */
public class TipSync {
    private static final String TAG = "iGoal.TipSync";
    private final BackendClient client;
    private final Context context;

    public TipSync(Context context, String deviceId) {
        this.context = context;
        this.client = new BackendClient(deviceId);
    }

    /**
     * Executes daily sync:
     * 1. Check backend health
     * 2. Pull today's fixtures
     * 3. Sync free & premium prediction tips
     * 4. Settle finished match predictions using incremental since timestamp
     */
    public boolean performSync(String customBaseUrl, String todayDateUtc, long lastSettledEpochSec) {
        try {
            Log.d(TAG, "Starting sync with backend...");

            // 1. Health check
            BackendClient.HealthResponse health = client.checkHealth(customBaseUrl);
            if (!health.ok) {
                Log.w(TAG, "Backend reported unhealthy state: " + health.mode);
                return false;
            }

            // 2. Fetch fixtures
            BackendClient.FixturesResponse fixturesResp = client.fetchFixtures(customBaseUrl, todayDateUtc);
            Log.i(TAG, "Fetched " + fixturesResp.fixtures.size() + " fixtures from " + fixturesResp.source);

            // 3. Fetch tips (free tier)
            BackendClient.TipsResponse freeTips = client.fetchTips(customBaseUrl, "free");
            Log.i(TAG, "Synced " + freeTips.tips.size() + " free tips from " + freeTips.source);

            // 4. Fetch incremental settlement results
            BackendClient.ResultsResponse resultsResp = client.fetchResults(customBaseUrl, lastSettledEpochSec);
            Log.i(TAG, "Processed " + resultsResp.results.size() + " settlement outcomes from " + resultsResp.source);

            return true;
        } catch (IOException e) {
            Log.e(TAG, "Network or parsing failure during sync: " + e.getMessage(), e);
            return false;
        }
    }
}
