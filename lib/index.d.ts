// Type definitions for @hapipal/schmervice 2.0
// Project: https://github.com/hapipal/schmervice#readme
// Definitions by: Tim Costa <https://github.com/timcosta>
//                 Danilo Alonso <https://github.com/damusix>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4

import {
    Plugin,
    Server as HapiServer,
    ServerOptionsCache,
    ServerMethodOptions,
    Lifecycle
} from '@hapi/hapi';

type Func = (...args: any[]) => (any | Promise<any>);

type OnlyFunctionProperties<T> = {
    [K in keyof T]: T[K] extends Func ? K : never;
}[keyof T];

type NonFunctionProperties<T> = {
    [K in keyof T]: T[K] extends Func ? never : K;
}[keyof T];

type AnyObj = Record<string, any>;

/**
 * This is a symbol that can be added as a property to either a service class
 * or service object. Its value should be a string, and this value will be
 * taken literally as the service's name without any camel-casing. A service
 * class or object's `Schmervice.name` property is always preferred to its
 * natural class name or `name` property, so this property can be used as an
 * override.
 *
 * https://github.com/hapipal/schmervice/blob/main/API.md#schmervicename
 */
export const name: unique symbol;

/**
 * This is a symbol that can be added as a property to either a service class
 * or service object. When the value of this property is `true` or `'plugin'`,
 * then the service is not available to `server.services()` for any namespace
 * aside from that of the plugin that registered the service. This effectively
 * makes the service "private" within the plugin that it is registered.
 *
 * The default behavior, which can also be declared explicitly by setting this
 * property to `false` or `'server'`, makes the service available within the
 * current plugin's namespace, and all of the namespaces of that plugin's
 * ancestors up to and including the root server (i.e. the namespace accessed
 * by `server.services(true)`).
 *
 * https://github.com/hapipal/schmervice/blob/main/API.md#schmervicesandbox
 */
export const sandbox: unique symbol;


interface WithName {

    /**
     * This is a helper that assigns name to the service instance or object
     * produced by `serviceFactory` by setting the service's `Schmervice.name`.
     * When `serviceFactory` is a service class or object, `Schmervice.withName()`
     * returns the same service class or object mutated with `Schmervice.name`
     * set accordingly. When `serviceFactory` is a function, this helper returns a
     * new function that behaves identically but adds the `Schmervice.name`
     * property to its result. If the resulting service class or object already
     * has a `Schmervice.name` then this helper will fail.
     *
     * https://github.com/hapipal/schmervice/blob/main/API.md#schmervicewithnamename-options-servicefactory
     *
     * @param name name of the service
     * @param serviceFactory factory function that returns a service
     */
    (name: string, serviceFactory: RegisterServiceConfiguration): RegisterServiceConfiguration;

    /**
     * Following a similar logic and behavior to the above: when `options` is
     * present, this helper also assigns `options.sandbox` to the service instance
     * or object produced by `serviceFactory` by setting the service's
     * `Schmervice.sandbox`. If the resulting service class or object already has
     * a `Schmervice.sandbox` then this helper will fail.
     *
     * https://github.com/hapipal/schmervice/blob/main/API.md#schmervicewithnamename-options-servicefactory
     *
     * @param name name of the service
     * @param options service registration options
     * @param serviceFactory factory function that returns a service
     */
    (name: string, options: WithNameOptions, serviceFactory: RegisterServiceConfiguration): RegisterServiceConfiguration;
}

/**
 * See https://github.com/hapipal/schmervice/blob/main/API.md#schmervicewithnamename-options-servicefactory
 */
export const withName: WithName;

/**
 * This is a helper type that can be used to define the caching options for
 * each method of a service. It is a partial object where each key is the name
 * of a method on the service, and each value is either an object containing
 * the `cache` options as detailed in the
 *
 */
export type ServiceCachingOptions<T = AnyObj> = Omit<
    Partial<
        Record<
            OnlyFunctionProperties<T>,
            ServerOptionsCache | Exclude<ServerMethodOptions, 'bind'>
        >
    >,
    keyof Service
>;

export type ServiceSandbox = boolean | 'plugin' | 'server';

export interface ServiceRegistrationObject<T = AnyObj>{
    caching?: ServiceCachingOptions<T>
    name?: string
    [name]?: string
    [sandbox]?: ServiceSandbox

    initialize?(): Lifecycle.Method;
    teardown?(): Lifecycle.Method;

    [serviceMethod: string]: unknown;
}

/**
 * Utility type to define a service object that was registered as an
 * instance of another class, or as an object.
 *
 * @example
 *
 * declare module '@hapipal/schmervice' {
 *
 *     interface RegisteredServices {
 *
 *         mailer: ServiceObject<NodeMailer.Transporter>;
 *     }
 * }
 *
 * const transport = NodeMailer.createTransport();
 *
 * server.registerService(
 *    withName('mailer', transport)
 * );
 */
export type ServiceObject<T = AnyObj> = ServiceRegistrationObject<T> & T;

/**
 * Function that returns a service registration object. Intended to be used
 * as a factory for creating service registration objects that can be passed
 * to `server.registerService()`.
 *
 * @param server
 * @param options
 */
export interface ServiceFactory<T = AnyObj, O = unknown> {

    (server: HapiServer, options: O): ServiceRegistrationObject<T>;
}

// options is any because it's left to the implementer to define based on usage
export type ServiceOptions = any;

/**
 * This class is intended to be used as a base class for services registered
 * with schmervice. However, it is completely reasonable to use this class
 * independently of the schmervice plugin if desired.
 *
 * https://github.com/hapipal/schmervice/blob/main/API.md#schmerviceservice
 */
export class Service<O = ServiceOptions> {

    /**
     * This is not set on the base service class, but when an extending class
     * has a static caching property (or getter) then its value will be used
     * used to configure service method caching (via service.caching() when
     * the service is instanced).
     *
     * https://github.com/hapipal/schmervice/blob/main/API.md#servicecaching
     */
    static caching: ServiceCachingOptions;


    static [name]: string;
    static [sandbox]: ServiceSandbox;

    /**
     * The `server` passed to the constructor.  Should be a hapi plugin's
     * server or root server.
     */
    server: HapiServer;

    /**
     * The hapi plugin `options` passed to the constructor.
     */
    options: O;


    constructor(server: HapiServer, options: O);

    /**
     * The context of `service.server` set using [`server.bind()`](https://github.com/hapijs/hapi/blob/master/API.md#server.bind()).
     * Will be `null` if no context has been set.  This is implemented lazily
     * as a getter based upon `service.server` so that services can be part of
     * the context without introducing any circular dependencies between the
     * two.
     */
    get context(): object | null;

    /**
     * Configures caching for the service's methods, and may be called once.
     * The `options` argument should be an object where each key is the name
     * of one of the service's methods, and each corresponding value is either,
     *
     * - An object `{ cache, generateKey }` as detailed in the
     * [server method options](https://github.com/hapijs/hapi/blob/master/API.md#server.method())
     * documentation.
     *
     * - An object containing the `cache` options as detailed in the
     * [server method options](https://github.com/hapijs/hapi/blob/master/API.md#server.method())
     * documentation.
     *
     * Note that behind the scenes an actual server method will be created on
     * `service.server` and will replace the respective method on the service
     * instance, which means that any service method configured for caching
     * must be called asynchronously even if its original implementation is
     * synchronous.  In order to configure caching, the service class also
     * must have a `name`, e.g.
     * `class MyServiceName extends Schmervice.Service {}`.
     *
     * https://github.com/hapipal/schmervice/blob/main/API.md#servicecachingoptions
     *
     * @param options caching options
     */
    caching <T = Record<string, any>>(options: ServiceCachingOptions<T>): void;

    /**
     * Returns a new service instance where all methods are bound to the
     * service instance allowing you to deconstruct methods without losing the
     * `this` context.
     */
    bind(): this;

    /**
     * This is not implemented on the base service class, but when it is
     * implemented by an extending class then it will be called during
     * `server` initialization (via `onPreStart` [server extension](https://github.com/hapijs/hapi/blob/master/API.md#server.ext())
     * added when the service is instanced).
     */
    initialize?(): Lifecycle.Method;

    /**
     * This is not implemented on the base service class, but when it is
     * implemented by an extending class then it will be called during
     * `server` stop (via `onPostStop` [server extension](https://github.com/hapijs/hapi/blob/master/API.md#server.ext())
     * added when the service is instanced).
     */
    teardown?(): Lifecycle.Method;
}

export type RegisterServiceConfiguration = (
    typeof Service<any> |
    ServiceFactory |
    ServiceRegistrationObject
);

export const plugin: Plugin<Record<string, unknown>>;

export interface WithNameOptions {
    sandbox?: ServiceSandbox
}

// a
//

/**
 * An extensible interface that can be used to define the services
 * that are available on the server. Allows service definitions to
 * optionally  "register" themselves as types that will be returned
 * by using  typescript declaration merging with interfaces.
 *
 * @example
 *
 * declare module '@hapipal/schmervice' {
 *
 *   interface RegisteredServices {
 *
 *        test: TestService;
 *        other: Service & typeof otherService;
 */
export interface RegisteredServices {
    [key: string]: Service | ServiceObject<any>;
}


/**
 * Server decorator for getting services scoped to the
 * current plugin realm using `server.services()`,
 * or services registered on the server using `server.services(true)`,
 * or services scoped to plugin namespace using `server.services('namespace')`.
 *
 *
 *
 * This interface can be overwritten to modify what you want your namespace
 * to actually return. For example:
 *
 * @example
 *
 * declare module '@hapipal/schmervice' {
 *    type AuthServices = {
 *        Members: Service
 *        Admin: Service
 *        Mananger: Service
 *    }
 *
 *    type OathServices = {
 *        Witness: Service
 *        Promissory: Service
 *        CrownCourt: Service
 *    }
 *
 *    interface SchmerviceDecorator {
 *        (namespace: 'auth'): AuthServices
 *        (namespace: 'oath'): OathServices
 *    }
 * }
 *
 */
export interface SchmerviceDecorator {

    /**
     * Returns an object containing each service instance keyed by their
     * instance names.
     *
     * The services that are available on this object are only those
     * registered by `server` or any plugins for which `server` is an ancestor
     * (e.g. if `server` has registered a plugin that registers services) that
     * are also not [sandboxed](#service-naming-and-sandboxing).  By passing a
     * `namespace` you can obtain the services from the perspective of a
     * different plugin.  When `namespace` is a string, you receive services
     * that are visibile within the plugin named `namespace`.  And when
     * `namespace` is `true`, you receive services that are visibile to the
     * root server: every service registered with the hapi server– across all
     * plugins– that isn't sandboxed.
     */
    (namespace?: string): RegisteredServices

    /**
     * Returns an object containing each service instance keyed by their
     * instance names. When `all` is `true`, you receive services that are
     * visibile to the root server: every service registered with the hapi
     *
     */
    (all?: boolean): RegisteredServices

}



declare module '@hapi/hapi' {

    interface Server {
        registerService: (config: RegisterServiceConfiguration | RegisterServiceConfiguration[]) => void;
        services: SchmerviceDecorator;
    }

    interface Request {
        services: SchmerviceDecorator;
    }

    interface ResponseToolkit {
        services: SchmerviceDecorator;
    }
}
