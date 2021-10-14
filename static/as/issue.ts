import { JSON } from 'assemblyscript-json';

declare function kvstore_get(key: string): string;
declare function kvstore_update(key: string, value: string): string;
declare function kvstore_create(value: string): string;

// #region classes
class Issue {
  public id: string;
  public title: string;
  public description: string;

  constructor(id: string, title: string, description: string) {
    this.title = title;
    this.description = description;
    this.id = id;
  }

  static fromJSONString(input: string): Issue {
    const raw = <JSON.Obj>JSON.parse(input);
    const id = (<JSON.Str>raw.getString('id')).toString();
    const title = (<JSON.Str>raw.getString('title')).toString();
    const desc = (<JSON.Str>raw.getString('description')).toString();
    return new Issue(id, title, desc);
  }

  public toJSONString(): string {
    const obj = JSON.Value.Object();
    obj.set('title', this.title);
    obj.set('description', this.description);
    obj.set('id', this.id);
    return obj.toString();
  }
}

class IssueManager {
  private issues: string[];

  constructor() {
    this.issues = [];
    this.load();
  }

  private load(): void {
    const rawList = kvstore_get('list');
    if (rawList) {
      const issues = <JSON.Arr>(JSON.parse(rawList));
      for (let i = 0; i < issues._arr.length; i++) {
        this.issues.push(
          (<JSON.Str>issues._arr[i]).toString()
        );
      }
    }
  }

  private save(): void {
    const list = (<JSON.Arr>JSON.from<string[]>(this.issues)).toString();
    kvstore_update('list', list);
  }

  add(title: string, description: string): Issue {
    const id = (this.issues.length + 1).toString();
    const issue = new Issue(id, title, description);
    const key = kvstore_create(issue.toJSONString());

    this.issues.push(key);
    this.save();

    return issue;
  }

  list(): Issue[] {
    const res: Issue[] = [];
    for (let i = 0; i < this.issues.length; i++) {
      const data = kvstore_get(this.issues[i]);
      const issue = Issue.fromJSONString(data);
      res.push(issue);
    }

    return res;
  }
}

// #endregion

// #region endpoints
export function add(input: string): string {
  const raw = <JSON.Obj>JSON.parse(input);

  const title = (<JSON.Str>raw.getString('title')).toString();
  const description = (<JSON.Str>raw.getString('description')).toString();

  const manager = new IssueManager();
  const issue = manager.add(title, description);

  return issue.toJSONString();
}

export function list(): string {
  const manager = new IssueManager();
  const issues = manager.list();
  const result: string[] = [];

  for (let i = 0; i < issues.length; i++) {
    result.push(issues[i].toJSONString());
  }

  return (<JSON.Arr>JSON.from<string[]>(result)).toString();
}
// #endregion