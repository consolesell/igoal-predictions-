package com.example.igoalpredictions.sync;

import android.content.Context;
import android.util.Log;
import com.example.igoalpredictions.network.BackendClient;
import java.io.IOException;

/**
 * Worker / Sync Manager for iGoal Predictions Android App (v2.0)
 * Coordinates syncing fixtures, prediction tips (Free & VIP), and settlement outcomes.
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
     * 2. Pull user profile / entitlement
     * 3. Pull today's fixtures (with club logo URLs)
     * 4. Sync free prediction tips
     * 5. Sync premium prediction tips (handles upgradeRequired without crash)
     * 6. Settle finished match predictions using incremental since timestamp
     */
    public boolean performSync(String customBaseUrl, String authToken, String todayDateUtc, long lastSettledEpochSec) {
        try {
            Log.d(TAG, "Starting sync with backend...");
            client.setAuthToken(authToken);

            // 1. Health check
            BackendClient.HealthResponse health = client.checkHealth(customBaseUrl);
            if (!health.ok) {
                Log.w(TAG, "Backend reported unhealthy state: " + health.mode);
                return false;
            }

            // 2. Fetch User Profile if authenticated
            if (authToken != null && !authToken.isEmpty()) {
                try {
                    BackendClient.MeResponse me = client.fetchProfile(customBaseUrl);
                    Log.i(TAG, "User tier: " + me.tier + ", isVip: " + me.isVip);
                } catch (IOException e) {
                    Log.w(TAG, "Could not fetch profile: " + e.getMessage());
                }
            }

            // 3. Fetch fixtures (includes homeLogoUrl, awayLogoUrl)
            BackendClient.FixturesResponse fixturesResp = client.fetchFixtures(customBaseUrl, todayDateUtc);
            Log.i(TAG, "Fetched " + fixturesResp.fixtures.size() + " fixtures from " + fixturesResp.source);

            // 4. Fetch free tips
            BackendClient.TipsResponse freeTips = client.fetchTips(customBaseUrl, "free");
            Log.i(TAG, "Synced " + freeTips.tips.size() + " free tips from " + freeTips.source);

            // 5. Fetch premium tips (if user is VIP or to check paywall state)
            BackendClient.TipsResponse premiumResp = client.fetchTips(customBaseUrl, "premium");
            if (Boolean.TRUE.equals(premiumResp.upgradeRequired)) {
                Log.i(TAG, "Premium tips gated: " + premiumResp.message);
            } else {
                Log.i(TAG, "Synced " + premiumResp.tips.size() + " VIP premium tips");
            }

            // 6. Fetch incremental settlement results
            BackendClient.ResultsResponse resultsResp = client.fetchResults(customBaseUrl, lastSettledEpochSec);
            Log.i(TAG, "Processed " + resultsResp.results.size() + " settlement outcomes from " + resultsResp.source);

            return true;
        } catch (IOException e) {
            Log.e(TAG, "Network or parsing failure during sync: " + e.getMessage(), e);
            return false;
        }
    }
}
