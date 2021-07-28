import { routeTests } from "./routes/user.tests"
import { resolverTests } from "./resolvers/user.tests";

describe('tests', () => {
    describe('resolver tests', resolverTests);
    describe('route tests', routeTests);
})