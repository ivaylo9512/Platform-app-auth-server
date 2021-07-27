import { routeTests } from "./routes/user.tests"
import { resolverTests } from "./resolvers/user.tests";

describe('tests', () => {
    describe('route tests', resolverTests);
    describe('route tests', routeTests);
})