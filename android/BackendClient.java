package com.example.igoalpredictions.network;

import com.google.gson.annotations.SerializedName;
import java.io.IOException;
import java.util.List;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.google.gson.Gson;

/**
 * Android HTTP Client for iGoal Predictions Backend
 * Connects to https://api.igoalpredictions.com/v1/
 */
public class BackendClient {
    private static final String BASE_URL = "https://api.igoalpredictions.com";
    private final OkHttpClient httpClient;
    private final Gson gson;
    private final String deviceId;

    public BackendClient(String deviceId) {
        this.deviceId = deviceId;
        this.httpClient = new OkHttpClient.Builder().build();
        this.gson = new Gson();
    }

    // --- Data Transfer Objects ---

    public static class HealthResponse {
        @SerializedName("ok") public boolean ok;
        @SerializedName("version") public String version;
        @SerializedName("mode") public String mode;
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
    }

    public static class TipsResponse {
        @SerializedName("source") public String source;
        @SerializedName("tips") public List<TipItem> tips;
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

    // --- API Calls ---

    public HealthResponse checkHealth(String customBaseUrl) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : BASE_URL;
        Request request = new Request.Builder()
                .url(base + "/v1/health")
                .addHeader("X-Device-ID", this.deviceId)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), HealthResponse.class);
        }
    }

    public FixturesResponse fetchFixtures(String customBaseUrl, String yyyyMmDd) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : BASE_URL;
        Request request = new Request.Builder()
                .url(base + "/v1/fixtures?date=" + yyyyMmDd)
                .addHeader("X-Device-ID", this.deviceId)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), FixturesResponse.class);
        }
    }

    public TipsResponse fetchTips(String customBaseUrl, String tier) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : BASE_URL;
        Request request = new Request.Builder()
                .url(base + "/v1/tips?tier=" + (tier != null ? tier : "free"))
                .addHeader("X-Device-ID", this.deviceId)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), TipsResponse.class);
        }
    }

    public ResultsResponse fetchResults(String customBaseUrl, long sinceEpochSec) throws IOException {
        String base = customBaseUrl != null ? customBaseUrl : BASE_URL;
        Request request = new Request.Builder()
                .url(base + "/v1/results?since=" + sinceEpochSec)
                .addHeader("X-Device-ID", this.deviceId)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            return gson.fromJson(response.body().string(), ResultsResponse.class);
        }
    }
}
