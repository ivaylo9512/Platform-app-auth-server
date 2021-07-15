import { Migration } from '@mikro-orm/migrations';

export class Migration20210715133437 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "refresh_token" add column "created_at" timestamptz(0) not null, add column "expires_at" timestamptz(0) not null;');
  }

}
