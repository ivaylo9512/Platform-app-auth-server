import { MikroORM } from '@mikro-orm/core'
import mikroConfig from './mikro-orm.config';

const main = async () => {
    const orm = MikroORM.init(mikroConfig)
}
main().catch(err => console.log(err));