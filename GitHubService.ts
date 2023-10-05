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

  async searchPerticipatedIssues(date: Date, username: string) {
    const since = this.startOfDay(date, this.TZ_OFFSET);
    const until = this.endOfDay(date, this.TZ_OFFSET);

    const res = await this.octokit.request("GET /search/issues", {
      headers: this.headers(),
      q: `assignee:${username} updated:${since.toISOString()}..${until.toISOString()}`,
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

  async searchReviewedPullRequests(date: Date, username: string) {
    const since = this.startOfDay(date, this.TZ_OFFSET);
    const until = this.endOfDay(date, this.TZ_OFFSET);

    const res = await this.octokit.request("GET /search/issues", {
      headers: this.headers(),
      q: `reviewed-by:${username} updated:${since.toISOString()}..${until.toISOString()}`,
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

  // タイムゾーンを加味してその日の23:59:59を返す
  private endOfDay(date: Date, offsetHour: number) {
    const dateTZ = new Date(date.getTime() + offsetHour * 60 * 60 * 1000);
    const endOfDay = new Date(
      dateTZ.getFullYear(),
      dateTZ.getMonth(),
      dateTZ.getDate(),
      23,
      59,
      59
    );
    return endOfDay;
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
