import * as Hapi from '@hapi/hapi';
import { types as Lab } from '@hapi/lab';

import {
    plugin,
    Service,
    ServiceCachingOptions,
    ServiceRegistrationObject,
    ServiceFactory,
    withName,
    name
} from '..';

const { expect } = Lab;

declare module '..' {

    export interface RegisteredServices {
        testService: TestService;
        other: Service & typeof otherService;
        yetAnother: ServiceObject<typeof aThirdPartySomething>;
    }
}

class TestService extends Service {

    static caching: ServiceCachingOptions<TestService> = {

        test: { generateTimeout: 1 },
    };

    constructor(server: Hapi.Server, options: any) {

        super(server, options);

        // False because we're testing types, not functionality
        false && this.caching<TestService>({

            test2: { generateTimeout: 1 },
        });
    }

    someProp: string = 'test';

    async test() {
        return 'test';
    }

    async test2() {
        return 'test';
    }
}

const otherService = {
    name: 'other',
    caching: {
        test: {

            generateTimeout: 1
        },
    },
    someProp: 'test',
    test: async () => 'test',
} satisfies ServiceRegistrationObject



const aThirdPartySomething = {
    test1: async () => 'test',
    test2: async () => 'test',
    someProp: 'test',
}

const makeYetAnother: ServiceFactory<typeof aThirdPartySomething> = (
    server,
    options
) => {

    return {

        name: 'yetAnother',
        caching: {
            test1: {

                cache: 'test-cache', generateTimeout: 1 },
        },
        ...aThirdPartySomething
    }
}


(async function () {

    type CachingOpts = ServiceCachingOptions<typeof aThirdPartySomething>;

    expect.error<CachingOpts>(
        {
            test1: { generateTimeout: 1 },
            test2: { generateTimeout: 1 },
            anythingElse: { generateTimeout: 1  }
        }
    )

    const server = Hapi.server();

    server.register({ plugin });


    server.registerService(TestService);
    server.registerService(otherService);
    server.registerService(makeYetAnother);

    class XService extends TestService {}
    class YService extends TestService {}
    class ZService extends TestService {}

    const servA = { name: 'a', b: 1 };
    const servB = { name: 'b', b: 1 };
    const servC = { name: 'c', b: 1 };
    const servAFn: ServiceFactory = () => ({ name: 'fna', b: 1 });
    const servBFn: ServiceFactory = () => ({ name: 'fnb', b: 1 });
    const servCFn: ServiceFactory = () => ({ name: 'fnc', b: 1 });

    server.registerService([servA, servB]);
    server.registerService([servAFn, servBFn]);
    server.registerService([XService, YService]);
    server.registerService([ZService, servC, servCFn]);

    expect.type<TestService>(server.services().testService);
    expect.type<typeof otherService>(server.services().other);
    expect.type<ReturnType<typeof makeYetAnother>>(server.services().yetAnother);

    expect.type<string>(await server.services().testService.test());
    expect.type<string>(await server.services().other.test());
    expect.type<string>(await server.services().yetAnother.test1());
    expect.type<string>(await server.services().yetAnother.test2());

    expect.type<string>(server.services().testService.someProp);
    expect.type<string>(server.services().other.someProp);
    expect.type<string>(server.services().yetAnother.someProp);


    try {

        expect.error(
            () => server.registerService(

                withName('test'),
            )
        );
    }
    catch (err) {}
}());