import { GitHubService } from "./GitHubService";

function extractEnv() {
  const accessToken = process.env.PERSONAL_ACCESS_TOKEN;
  if (accessToken == null || accessToken === "") {
    throw new Error("PERSONAL_ACCESS_TOKEN is not set");
  }

  const githubApiVersion = process.env.GITHUB_API_VERSION;
  if (githubApiVersion == null || githubApiVersion === "") {
    throw new Error("GITHUB_API_VERSION is not set");
  }

  const githubUser = process.env.GITHUB_USER;
  if (githubUser == null || githubUser === "") {
    throw new Error("GITHUB_USER is not set");
  }

  return { accessToken, githubApiVersion, githubUser };
}

async function main(date: Date) {
  const { accessToken, githubApiVersion, githubUser } = extractEnv();
  const service = new GitHubService(githubApiVersion, accessToken);
  const issues = await service.searchPerticipatedIssues(date, githubUser);
  const reviewedPullRequests = await service.searchReviewedPullRequests(
    date,
    githubUser
  );

  // issues と reviewedPullRequests をマージする
  for (let reviewedPullRequest of reviewedPullRequests) {
    issues.push(reviewedPullRequest);
  }

  console.log(
    `# ${date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
    })} の活動報告`
  );

  // issues を　organization, repository でソートする
  issues.sort((a, b) => {
    if (a.organization < b.organization) {
      return -1;
    } else if (a.organization > b.organization) {
      return 1;
    } else {
      if (a.repository < b.repository) {
        return -1;
      } else if (a.repository > b.repository) {
        return 1;
      } else {
        return 0;
      }
    }
  });

  // ソート済みのissuesをループしてヘッダと内容を出力
  let currentOrganization = "";
  let currentRepository = "";

  for (let issue of issues) {
    if (issue.organization !== currentOrganization) {
      currentOrganization = issue.organization;
    }
    if (issue.repository !== currentRepository) {
      console.log(`\n## ${issue.organization}/${issue.repository}`);
      currentRepository = issue.repository;
    }

    console.log(`- ${issue.url}`);
  }
}

let date = new Date();
if (process.argv.length > 2) {
  date = new Date(process.argv[2]);
}
main(date);
