/**
 * Centralized data loader – called once on app init.
 *
 * Strategy:
 *  1. Load "repo" (home page) data first; the UI can render as soon as it resolves.
 *  2. Load all other data silently in the background (no await at call site).
 */

import { get } from 'svelte/store';
import {
  currentProject,
  hfModels,
  hfModelsLoading,
  hfModelsError,
  hfModelsSummary,
  hfModelsLoaded,
  potentialIssues,
  potentialIssuesLoading,
  potentialIssuesError,
  repoFixes,
  repoFixesLoading,
  repoFixesError,
  xpuSyncIssues,
  xpuSyncLoading,
  xpuSyncError,
  scanReports,
  scanReportsLoading,
  scanReportsError,
  selectedModelKey,
  tritonOps,
  tritonOpsLoading,
  tritonOpsError,
  tritonInsights,
  tritonInsightsLoading,
  tritonInsightsError,
  licenseReports,
  licenseReportsLoading,
  licenseReportsError,
  licenseReportsLoaded,
  syclReports,
  syclReportsLoading,
  syclReportsError,
  syclReportsLoaded,
} from '$lib/stores/appStore';
import { repoData, isLoadingData, dataError, cachedRepoData } from '$lib/stores/dataStore';
import {
  fetchGitHubTopics,
  fetchHFModels,
  fetchPotentialIssues,
  fetchRepoFixes,
  fetchXPUSync,
  fetchScanReport,
  fetchTritonOps,
  fetchTritonInsights,
  fetchLicenseReport,
  fetchSyclReport,
} from '$lib/services/api';
import { processHFModel, getMockModels } from '$lib/utils/modelProcessor';

// Track whether each dataset has ever been loaded so we never re-fetch on tab switch.
const loaded = {
  repo: false,
  models: false,
  issues: false,
  fixes: false,
  xpuSync: false,
  scan: false,
  tritonOps: false,
  tritonInsights: false,
  license: false,
  sycl: false,
};

// ─── individual loaders ───────────────────────────────────────────────────────

async function loadRepoData(repo: string) {
  const cacheKey = `${repo}_7`;
  const cache = get(cachedRepoData);
  if (cache.has(cacheKey)) {
    repoData.set(cache.get(cacheKey)!);
    loaded.repo = true;
    return;
  }

  isLoadingData.set(true);
  dataError.set(null);
  try {
    const data = await fetchGitHubTopics({ repo, days: 7, max_commits: 10 });
    repoData.set(data);
    cachedRepoData.update(c => { c.set(cacheKey, data); return c; });
    loaded.repo = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch repo data';
    dataError.set(msg);
  } finally {
    isLoadingData.set(false);
  }
}

async function loadModels() {
  if (loaded.models || get(hfModelsLoaded)) return;
  hfModelsLoading.set(true);
  hfModelsError.set(null);
  try {
    const response = await fetchHFModels({ limit: 10, task: 'text-generation' });
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from API');
    }
    const processed = response.data.map((model, index) => processHFModel(model, index));
    const sorted = processed.length > 0
      ? [...processed].sort((a, b) => (b.rawData?.likes || 0) - (a.rawData?.likes || 0))
      : getMockModels();

    hfModels.set(sorted);
    selectedModelKey.set(sorted[0].key);

    if (response.summary?.markdown_report) {
      hfModelsSummary.set(response.summary.markdown_report);
    }
    hfModelsLoaded.set(true);
    loaded.models = true;
  } catch (err) {
    hfModelsError.set(err instanceof Error ? err.message : 'Failed to load models');
    hfModelsLoaded.set(true);
  } finally {
    hfModelsLoading.set(false);
  }
}

async function loadPotentialIssues() {
  if (loaded.issues) return;
  potentialIssuesLoading.set(true);
  potentialIssuesError.set(null);
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await fetchPotentialIssues({ date: today, page: 1, page_size: 1000 });
    potentialIssues.set(data.data || []);
    loaded.issues = true;
  } catch (err) {
    potentialIssuesError.set(err instanceof Error ? err.message : 'Failed to load issues');
  } finally {
    potentialIssuesLoading.set(false);
  }
}

async function loadRepoFixes() {
  if (loaded.fixes) return;
  repoFixesLoading.set(true);
  repoFixesError.set(null);
  try {
    const data = await fetchRepoFixes({ page: 1, page_size: 1000 });
    repoFixes.set(data.data || []);
    loaded.fixes = true;
  } catch (err) {
    repoFixesError.set(err instanceof Error ? err.message : 'Failed to load fixes');
  } finally {
    repoFixesLoading.set(false);
  }
}

async function loadXPUSync() {
  if (loaded.xpuSync) return;
  xpuSyncLoading.set(true);
  xpuSyncError.set(null);
  try {
    const data = await fetchXPUSync({ page: 1, page_size: 1000 });
    xpuSyncIssues.set(data.data || []);
    loaded.xpuSync = true;
  } catch (err) {
    xpuSyncError.set(err instanceof Error ? err.message : 'Failed to load XPU sync data');
  } finally {
    xpuSyncLoading.set(false);
  }
}

async function loadScanReport() {
  if (loaded.scan) return;
  scanReportsLoading.set(true);
  scanReportsError.set(null);
  try {
    const data = await fetchScanReport({ page: 1, page_size: 1000 });
    scanReports.set(data.data || []);
    loaded.scan = true;
  } catch (err) {
    scanReportsError.set(err instanceof Error ? err.message : 'Failed to load scan reports');
  } finally {
    scanReportsLoading.set(false);
  }
}

async function loadTritonOps() {
  if (loaded.tritonOps || get(tritonOps).length > 0) return;
  tritonOpsLoading.set(true);
  tritonOpsError.set(null);
  try {
    const response = await fetchTritonOps();
    tritonOps.set(response.ops);
    loaded.tritonOps = true;
  } catch (err) {
    tritonOpsError.set(err instanceof Error ? err.message : 'Failed to load Triton ops');
  } finally {
    tritonOpsLoading.set(false);
  }
}

async function loadTritonInsights(repo: string) {
  if (loaded.tritonInsights) return;
  tritonInsightsLoading.set(true);
  tritonInsightsError.set(null);
  try {
    const response = await fetchTritonInsights({ repo, days: 7, max_commits: 5 });
    tritonInsights.set(response.data);
    loaded.tritonInsights = true;
  } catch (err) {
    tritonInsightsError.set(err instanceof Error ? err.message : 'Failed to load Triton insights');
  } finally {
    tritonInsightsLoading.set(false);
  }
}

async function loadLicenseReport() {
  if (loaded.license) return;
  licenseReportsLoading.set(true);
  licenseReportsError.set(null);
  try {
    const data = await fetchLicenseReport({ page: 1, page_size: 1000 });
    licenseReports.set(data.data || []);
    licenseReportsLoaded.set(true);
    loaded.license = true;
  } catch (err) {
    licenseReportsError.set(err instanceof Error ? err.message : 'Failed to load license report');
  } finally {
    licenseReportsLoading.set(false);
  }
}

async function loadSyclReport() {
  if (loaded.sycl) return;
  syclReportsLoading.set(true);
  syclReportsError.set(null);
  try {
    const data = await fetchSyclReport({ page: 1, page_size: 1000 });
    syclReports.set(data.data || []);
    syclReportsLoaded.set(true);
    loaded.sycl = true;
  } catch (err) {
    syclReportsError.set(err instanceof Error ? err.message : 'Failed to load SYCL report');
  } finally {
    syclReportsLoading.set(false);
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Call this once in App.svelte's onMount.
 * Awaits the home-page (repo) data first, then fires remaining loaders
 * concurrently in the background.
 */
export async function initializeAllData() {
  const repo = get(currentProject);

  // 1. Home page data — await so the UI is ready before we continue.
  await loadRepoData(repo);

  // 2. Everything else — fire-and-forget, don't block the UI.
  loadModels();
  loadPotentialIssues();
  loadRepoFixes();
  loadXPUSync();
  loadScanReport();
  loadTritonOps();
  loadTritonInsights(repo);
  loadLicenseReport();
  loadSyclReport();
}

/**
 * Re-load repo data when the user switches project (called from ChatWidget).
 * Other datasets are project-agnostic so they don't need re-loading.
 */
export async function reloadRepoData(repo: string) {
  loaded.repo = false;
  await loadRepoData(repo);
}
