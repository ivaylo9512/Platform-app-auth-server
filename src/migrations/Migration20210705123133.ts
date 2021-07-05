import { Migration } from '@mikro-orm/migrations';

export class Migration20210705123133 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "first_name" text not null, add column "last_name" text not null;');
  }

}
