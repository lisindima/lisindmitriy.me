export interface GithubActivityItem {
  repo: string;
  repoLabel: string;
  message: string;
  date: string;
  url: string;
  shortSha: string;
}

interface GithubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    committer?: { date?: string | null };
    author?: { date?: string | null };
  };
}

const SOURCES = [
  { repo: "lisindmitriy.me", label: "lisindmitriy.ru", take: 2 },
  { repo: "GeelyDiagnostics", label: "GeelyDiagnostics", take: 2 },
] as const;

const fallbackActivity: GithubActivityItem[] = [
  {
    repo: "lisindmitriy.me",
    repoLabel: "lisindmitriy.ru",
    message: "Add Geely Diagnostics to portfolio",
    date: "2026-09-20T16:30:22Z",
    url: "https://github.com/lisindima/lisindmitriy.me/commit/ba59e9bddf7a8c0321a718a908994cd0c2456b52",
    shortSha: "ba59e9b",
  },
  {
    repo: "GeelyDiagnostics",
    repoLabel: "GeelyDiagnostics",
    message: "feat: add display safe area diagnostics",
    date: "2026-08-31T07:34:05Z",
    url: "https://github.com/lisindima/GeelyDiagnostics/commit/b39874dd8829a4adcd75d24f3ed4f89a146f64fb",
    shortSha: "b39874d",
  },
];

let cachedActivity: Promise<GithubActivityItem[]> | undefined;

const firstLine = (value: string) => value.split("\n", 1)[0]?.trim() || "Update";

const fetchRepoCommits = async (
  repo: string,
  repoLabel: string,
  take: number,
): Promise<GithubActivityItem[]> => {
  const token = process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "lisindmitriy.me",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `https://api.github.com/repos/lisindima/${repo}/commits?per_page=6`,
    {
      headers,
      signal: AbortSignal.timeout(6_000),
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${repo}`);
  }

  const commits = (await response.json()) as GithubCommitResponse[];

  return commits
    .filter((item) => !firstLine(item.commit.message).toLowerCase().startsWith("merge "))
    .slice(0, take)
    .map((item) => ({
      repo,
      repoLabel,
      message: firstLine(item.commit.message),
      date:
        item.commit.committer?.date ??
        item.commit.author?.date ??
        new Date(0).toISOString(),
      url: item.html_url,
      shortSha: item.sha.slice(0, 7),
    }));
};

const loadActivity = async (limit: number): Promise<GithubActivityItem[]> => {
  try {
    const batches = await Promise.all(
      SOURCES.map((source) =>
        fetchRepoCommits(source.repo, source.label, source.take),
      ),
    );

    const items = batches
      .flat()
      .sort(
        (lhs, rhs) =>
          new Date(rhs.date).getTime() - new Date(lhs.date).getTime(),
      )
      .slice(0, limit);

    return items.length > 0 ? items : fallbackActivity.slice(0, limit);
  } catch (error) {
    console.warn("GitHub activity unavailable during build:", error);
    return fallbackActivity.slice(0, limit);
  }
};

export const getRecentGithubActivity = (
  limit = 4,
): Promise<GithubActivityItem[]> => {
  cachedActivity ??= loadActivity(Math.max(limit, 4));
  return cachedActivity.then((items) => items.slice(0, limit));
};
