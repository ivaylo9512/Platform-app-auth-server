import { Migration } from '@mikro-orm/migrations';

export class Migration20210727021413 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "username" text not null, "password" text not null, "created_at" timestamptz(0) not null, "updated_at" date not null, "first_name" text not null, "last_name" text not null, "email" text not null, "age" int4 not null, "role" text not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');

    this.addSql('create table "refresh_token" ("id" serial primary key, "token" text not null, "owner_id" int4 not null, "created_at" timestamptz(0) not null, "expires_at" timestamptz(0) not null);');

    this.addSql('alter table "refresh_token" add constraint "refresh_token_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;');
  }

}
