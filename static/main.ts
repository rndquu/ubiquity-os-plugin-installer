import { AuthService } from "./scripts/authentication";
import { ManifestFetcher } from "./scripts/fetch-manifest";
import { ManifestRenderer } from "./scripts/render-manifest";
import { renderOrgPicker } from "./scripts/rendering/org-select";
import { toastNotification } from "./utils/toaster";

async function handleAuth() {
  const auth = new AuthService();
  await auth.renderGithubLoginButton();
  return auth;
}

export async function mainModule() {
  const auth = await handleAuth();
  const renderer = new ManifestRenderer(auth);
  renderer.manifestGuiBody.dataset.loading = "false";

  try {
    const ubiquityOrgsToFetchOfficialConfigFrom = ["ubiquity-os"];
    const fetcher = new ManifestFetcher(ubiquityOrgsToFetchOfficialConfigFrom, auth.octokit);

    if (auth.isActiveSession()) {
      renderer.manifestGuiBody.dataset.loading = "true";
      const killNotification = toastNotification("Fetching manifest data...", { type: "info", shouldAutoDismiss: true });

      const userOrgs = await auth.getGitHubUserOrgs();
      const userOrgRepos = await auth.getGitHubUserOrgRepos(userOrgs);
      localStorage.setItem("orgRepos", JSON.stringify(userOrgRepos));
      renderOrgPicker(renderer, userOrgs);

      await fetcher.fetchMarketplaceManifests();
      await fetcher.fetchOfficialPluginConfig();
      renderer.manifestGuiBody.dataset.loading = "false";
      killNotification();
    } else {
      renderOrgPicker(renderer, []);
    }
  } catch (error) {
    if (error instanceof Error) {
      toastNotification(error.message, { type: "error" });
    } else {
      toastNotification(String(error), { type: "error" });
    }
  }
}

mainModule().catch(console.error);