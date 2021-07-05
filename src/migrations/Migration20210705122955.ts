import { Migration } from '@mikro-orm/migrations';

export class Migration20210705122955 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "age" timestamptz(0) not null;');
  }

}
