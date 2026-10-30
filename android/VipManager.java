package com.example.igoalpredictions.vip;

import android.content.Context;
import android.content.SharedPreferences;
import com.example.igoalpredictions.network.BackendClient;

/**
 * VIP Entitlement & Google Play Billing Integration Manager (Phase 3)
 */
public class VipManager {
    private static final String PREFS_NAME = "igoal_vip_prefs";
    private static final String KEY_TIER = "user_tier";
    private static final String KEY_EXPIRES_AT = "vip_expires_at";
    private static final String KEY_FIREBASE_TOKEN = "firebase_id_token";

    private final SharedPreferences prefs;

    public VipManager(Context context) {
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public boolean isVip() {
        String tier = prefs.getString(KEY_TIER, "free");
        if (!"vip".equalsIgnoreCase(tier)) return false;

        long expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0);
        long nowSec = System.currentTimeMillis() / 1000;
        return expiresAt == 0 || expiresAt > nowSec;
    }

    public void updateFromProfile(BackendClient.MeResponse profile) {
        if (profile == null) return;
        prefs.edit()
                .putString(KEY_TIER, profile.tier)
                .putLong(KEY_EXPIRES_AT, profile.expiresAt != null ? profile.expiresAt : 0)
                .apply();
    }

    public String getAuthToken() {
        return prefs.getString(KEY_FIREBASE_TOKEN, "");
    }

    public void saveAuthToken(String token) {
        prefs.edit().putString(KEY_FIREBASE_TOKEN, token).apply();
    }

    /**
     * GOOGLE PLAY BILLING PURCHASE FLOW DOCUMENTATION (Stub):
     *
     * 1. Initialize Play Billing Client:
     *    BillingClient billingClient = BillingClient.newBuilder(context)
     *        .setListener(purchasesUpdatedListener)
     *        .enablePendingPurchases()
     *        .build();
     *
     * 2. Query VIP Subscription SKU: "igoal_vip_monthly_pass"
     * 3. Launch purchase flow on user click: billingClient.launchBillingFlow(activity, params);
     * 4. On successful purchase token reception in onPurchasesUpdated:
     *    - Send purchaseToken to backend endpoint: POST /v1/billing/verify
     *    - Backend verifies with Google Play Developer API (androidpublisher.v3)
     *    - Backend triggers POST /v1/admin/users/entitlement setting tier='vip' and expires_at
     *    - Android re-queries GET /v1/me and refreshes UI to VIP Gold badge.
     */
}
