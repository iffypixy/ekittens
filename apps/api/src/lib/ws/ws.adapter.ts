import {INestApplicationContext} from "@nestjs/common";
import {AbstractWsAdapter, MessageMappingProperties} from "@nestjs/websockets";
import {Server, ServerOptions} from "socket.io";
import {fromEvent, Observable} from "rxjs";
import {filter, first, map, mergeMap, share, takeUntil} from "rxjs/operators";
import {isFunction, isNil} from "@nestjs/common/utils/shared.utils";
import {DISCONNECT_EVENT} from "@nestjs/websockets/constants";
import {CustomOrigin} from "@nestjs/common/interfaces/external/cors-options.interface";

// TODO: Using this until socket.io v3 is part of Nest.js, see: https://github.com/nestjs/nest/issues/5676
export class WebSocketAdapter extends AbstractWsAdapter {
  constructor(
    server: INestApplicationContext,
    private corsOrigin?:
      | boolean
      | string
      | RegExp
      | (string | RegExp)[]
      | CustomOrigin,
  ) {
    super(server);
  }

  public create(
    port: number,
    options?: any & {namespace?: string; server?: any},
  ): any {
    if (!options) {
      return this.createIOServer(port);
    }

    const {namespace, server, ...opt} = options;

    return server && isFunction(server.of)
      ? server.of(namespace)
      : namespace
      ? this.createIOServer(port, opt).of(namespace)
      : this.createIOServer(port, opt);
  }

  public createIOServer(port: number, options?: ServerOptions): Server {
    if (this.httpServer && port === 0)
      return new Server(this.httpServer, {
        cors: {
          origin: this.corsOrigin,
          methods: ["GET", "POST"],
          credentials: true,
        },
        cookie: true,
        maxHttpBufferSize: 1e6,
      });

    return new Server(port, options);
  }

  public bindMessageHandlers(
    client: any,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const disconnect$ = fromEvent(client, DISCONNECT_EVENT).pipe(
      share(),
      first(),
    );

    handlers.forEach(({message, callback}) => {
      const source$ = fromEvent(client, message).pipe(
        mergeMap((payload: any) => {
          const {data, ack} = this.mapPayload(payload);
          return transform(callback(data, ack)).pipe(
            filter((response: any) => !isNil(response)),
            map((response: any) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );
      source$.subscribe(([response, ack]) => {
        if (response.event) {
          return client.emit(response.event, response.data);
        }
        isFunction(ack) && ack(response);
      });
    });
  }

  public mapPayload(payload: any): {data: any; ack?: () => any} {
    if (!Array.isArray(payload))
      return {
        data: payload,
      };

    const lastElement = payload[payload.length - 1];

    const isAck = isFunction(lastElement);

    if (isAck) {
      const size = payload.length - 1;
      return {
        data: size === 1 ? payload[0] : payload.slice(0, size),
        ack: lastElement,
      };
    }

    return {data: payload};
  }
}
