import { Octokit } from "@octokit/core";

export type Issue = {
  title: string;
  url: string;
  organization: string;
  repository: string;
};

export class GitHubService {
  private octokit: Octokit;
  TZ_OFFSET = -9;

  constructor(private githubApiVersion: string, personalAccessToken: string) {
    this.octokit = new Octokit({ auth: personalAccessToken });
  }

  headers() {
    return {
      "X-GitHub-Api-Version": this.githubApiVersion,
    };
  }
  /**
  async fetchCommits(octokit: Octokit, user: string, date: Date) {
    const res = await octokit.request("GET /search/commits", {
      headers: this.headers(),
      q: `author:${user} author-date:2023-10-01..2023-10-04`,
    });
    res.data.items.slice(0, 4).forEach((item) => {
      console.log(item.commit.message);
    });
  }
  */

  async searchPerticipatedIssues(date: Date, username: string) {
    const since = this.startOfDay(date, this.TZ_OFFSET);
    const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const until = this.startOfDay(tomorrow, this.TZ_OFFSET);

    const res = await this.octokit.request("GET /search/issues", {
      headers: this.headers(),
      q: `involves:${username} created:${since.toISOString()}..${until.toISOString()}`,
      per_page: 100,
    });

    return res.data.items.map((item) => {
      {
        const url = new URL(item.repository_url);
        const organization = url.pathname.split("/")[2];
        const repository = url.pathname.split("/")[3];
        return {
          title: item.title,
          url: item.html_url,
          organization,
          repository,
        };
      }
    });
  }

  async fetchPerticipatedIssues(date: Date) {
    const since = this.startOfDay(date, this.TZ_OFFSET);
    const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const until = this.startOfDay(tomorrow, this.TZ_OFFSET);

    const res = await this.octokit.request("GET /issues", {
      headers: this.headers(),
      filter: "subscribed",
      state: "all",
      sort: "updated",
      since: since.toISOString(),
      until: until.toISOString(),
    });
    res.data.forEach((item) => {
      console.log(item.title);
    });
  }

  // タイムゾーンを加味してその日の00:00:00を返す
  private startOfDay(date: Date, offsetHour: number) {
    const dateTZ = new Date(date.getTime() + offsetHour * 60 * 60 * 1000);
    const startOfDay = new Date(
      dateTZ.getFullYear(),
      dateTZ.getMonth(),
      dateTZ.getDate()
    );
    return startOfDay;
  }
}
