import { Migration } from '@mikro-orm/migrations';

export class Migration20210715134544 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "role" text not null;');

    this.addSql('alter table "refresh_token" add column "token" text not null;');
  }

}
