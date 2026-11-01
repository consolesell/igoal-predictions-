package com.example.igoalpredictions.network;

import com.google.gson.annotations.SerializedName;
import java.io.IOException;
import java.util.List;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import com.google.gson.Gson;

/**
 * Android HTTP Client for iGoal Predictions Backend (v2.0)
 * Package: com.example.igoalpredictions
 * Compatible with minSdk 26, targetSdk 36
 * Base URL: https://api.igoalpredictions.com
 */
public class BackendClient {
    private static final String DEFAULT_BASE_URL = "https://api.igoalpredictions.com";
    private static final MediaType JSON_MEDIA = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient httpClient;
    private final Gson gson;
    private final String deviceId;
    private String authToken; // Firebase ID Token or Admin Token

    public BackendClient(String deviceId) {
        this.deviceId = deviceId;
        this.httpClient = new OkHttpClient.Builder().build();
        this.gson = new Gson();
    }

    public void setAuthToken(String token) {
        this.authToken = token;
    }

    // --- Data Transfer Objects ---

    public static class HealthResponse {
        @SerializedName("ok") public boolean ok;
        @SerializedName("version") public String version;
        @SerializedName("mode") public String mode;
    }

    public static class ClubItem {
        @SerializedName("id") public String id;
        @SerializedName("name") public String name;
        @SerializedName("shortName") public String shortName;
        @SerializedName("country") public String country;
        @SerializedName("logoPath") public String logoPath;
        @SerializedName("logoUrl") public String logoUrl;
        @SerializedName("updatedAt") public Long updatedAt;
    }

    public static class ClubsResponse {
        @SerializedName("source") public String source;
        @SerializedName("clubs") public List<ClubItem> clubs;
    }

    public static class FixtureItem {
        @SerializedName("id") public String id;
        @SerializedName("league") public String league;
        @SerializedName("country") public String country;
        @SerializedName("home") public String home;
        @SerializedName("away") public String away;
        @SerializedName("kickoff") public long kickoff; // Epoch SECONDS
        @SerializedName("status") public String status; // SCHEDULED, LIVE, FINISHED, POSTPONED
        @SerializedName("homeGoals") public Integer homeGoals;
        @SerializedName("awayGoals") public Integer awayGoals;
        @SerializedName("minute") public Integer minute;

        // Phase 2: Club & Logo additions (backward compatible, nullable)
        @SerializedName("homeClubId") public String homeClubId;
        @SerializedName("awayClubId") public String awayClubId;
        @SerializedName("homeLogoUrl") public String homeLogoUrl;
        @SerializedName("awayLogoUrl") public String awayLogoUrl;
    }

    public static class FixturesResponse {
        @SerializedName("source") public String source;
        @SerializedName("fixtures") public List<FixtureItem> fixtures;
    }

    public static class TipItem {
        @SerializedName("id") public String id;
        @SerializedName("fixtureId") public String fixtureId;
        @SerializedName("league") public String league;
        @SerializedName("home") public String home;
        @SerializedName("away") public String away;
        @SerializedName("kickoff") public long kickoff; // Epoch SECONDS
        @SerializedName("market") public String market;
        @SerializedName("selection") public String selection;
        @SerializedName("confidence") public int confidence; // 0-100
        @SerializedName("risk") public String risk; // LOW, MEDIUM, HIGH
        @SerializedName("explanation") public String explanation;
        @SerializedName("publishedAt") public long publishedAt; // Epoch SECONDS
        @SerializedName("modelVersion") public String modelVersion;

        // Phase 2: Club logos for fast UI rendering
        @SerializedName("homeLogoUrl") public String homeLogoUrl;
        @SerializedName("awayLogoUrl") public String awayLogoUrl;
    }

    public static class TipsResponse {
        @SerializedName("source") public String source;
        @SerializedName("tips") public List<TipItem> tips;
        // Phase 3: VIP Entitlement gating flag
        @SerializedName("upgradeRequired") public Boolean upgradeRequired;
        @SerializedName("message") public String message;
    }

    public static class SettlementItem {
        @SerializedName("predictionId") public String predictionId;
        @SerializedName("status") public String status; // WON, LOST, VOID, POSTPONED
        @SerializedName("homeGoals") public int homeGoals;
        @SerializedName("awayGoals") public int awayGoals;
        @SerializedName("settledAt") public long settledAt; // Epoch SECONDS
    }

    public static class ResultsResponse {
        @SerializedName("source") public String source;
        @SerializedName("results") public List<SettlementItem> results;
    }

    public static class MeResponse {
        @SerializedName("uid") public String uid;
        @SerializedName("email") public String email;
        @SerializedName("displayName") public String displayName;
        @SerializedName("role") public String role; // user, admin
        @SerializedName("tier") public String tier; // free, vip
        @SerializedName("expiresAt") public Long expiresAt; // Epoch SECONDS
        @SerializedName("isVip") public boolean isVip;
    }

    private Request.Builder newAuthenticatedRequest(String url) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .addHeader("X-Device-ID", this.deviceId);
        if (this.authToken != null && !this.authToken.isEmpty()) {
            builder.addHeader("Authorization", "Bearer " + this.authToken);
        }
        return builder;
    }

    // --- Public API Calls ---

    public HealthResponse checkHealth(String customBaseUrl) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/health").build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), HealthResponse.class);
        }
    }

    public FixturesResponse fetchFixtures(String customBaseUrl, String yyyyMmDd) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/fixtures?date=" + yyyyMmDd).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), FixturesResponse.class);
        }
    }

    public TipsResponse fetchTips(String customBaseUrl, String tier) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/tips?tier=" + (tier != null ? tier : "free")).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), TipsResponse.class);
        }
    }

    public ResultsResponse fetchResults(String customBaseUrl, long sinceEpochSec) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/results?since=" + sinceEpochSec).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), ResultsResponse.class);
        }
    }

    public ClubsResponse fetchClubs(String customBaseUrl) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/clubs").build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), ClubsResponse.class);
        }
    }

    public MeResponse fetchProfile(String customBaseUrl) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/me").build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), MeResponse.class);
        }
    }

    // --- Admin Operations (Phase 1) ---

    public FixtureItem createFixture(String customBaseUrl, FixtureItem newFixture) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        RequestBody body = RequestBody.create(gson.toJson(newFixture), JSON_MEDIA);
        Request request = newAuthenticatedRequest(base + "/v1/admin/fixtures")
                .post(body)
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code() + ": " + response.body().string());
            return gson.fromJson(response.body().string(), FixtureItem.class);
        }
    }

    public FixtureItem updateFixture(String customBaseUrl, String fixtureId, Object patchObj) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        RequestBody body = RequestBody.create(gson.toJson(patchObj), JSON_MEDIA);
        Request request = newAuthenticatedRequest(base + "/v1/admin/fixtures/" + fixtureId)
                .patch(body)
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code() + ": " + response.body().string());
            return gson.fromJson(response.body().string(), FixtureItem.class);
        }
    }

    public boolean deleteFixture(String customBaseUrl, String fixtureId, boolean force) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/admin/fixtures/" + fixtureId + "?force=" + force)
                .delete()
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            return response.isSuccessful();
        }
    }

    public TipItem publishTip(String customBaseUrl, TipItem newTip) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        RequestBody body = RequestBody.create(gson.toJson(newTip), JSON_MEDIA);
        Request request = newAuthenticatedRequest(base + "/v1/admin/tips")
                .post(body)
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code() + ": " + response.body().string());
            return gson.fromJson(response.body().string(), TipItem.class);
        }
    }

    public boolean deleteTip(String customBaseUrl, String tipId) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : DEFAULT_BASE_URL;
        Request request = newAuthenticatedRequest(base + "/v1/admin/tips/" + tipId)
                .delete()
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            return response.isSuccessful();
        }
    }
}
