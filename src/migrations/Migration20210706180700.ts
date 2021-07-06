import { Migration } from '@mikro-orm/migrations';

export class Migration20210706180700 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "email" text not null;');
  }

}
