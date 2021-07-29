import { Migration } from '@mikro-orm/migrations';

export class Migration20210729214544 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "birth" date not null;');
    this.addSql('alter table "user" drop column "age";');
  }

}
