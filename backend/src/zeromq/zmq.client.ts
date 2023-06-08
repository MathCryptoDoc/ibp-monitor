import { Logger } from '@nestjs/common';
import {
  ClientProxy,
  IncomingResponse,
  ReadPacket,
  WritePacket,
} from '@nestjs/microservices';
import { ERROR_EVENT, MESSAGE_EVENT } from '@nestjs/microservices/constants';
import * as zmq from 'zeromq';

// import {
//   ClientConfig,
//   Message,
//   PubSub,
//   Subscription,
//   Topic,
// } from '@google-cloud/pubsub';
type Topic = any;
import { ClientConfig, MessageAttributes } from './zmq.interfaces.js';
// import { PublishOptions } from '@google-cloud/pubsub/build/src/publisher';
// import { SubscriberOptions } from '@google-cloud/pubsub/build/src/subscriber';

import {
  ALREADY_EXISTS,
  ZMQ_PUBSUB_DEFAULT_CLIENT_CONFIG,
  ZMQ_PUBSUB_DEFAULT_INIT,
  ZMQ_PUBSUB_DEFAULT_NO_ACK,
  ZMQ_PUBSUB_DEFAULT_PUBLISHER_CONFIG,
  ZMQ_PUBSUB_DEFAULT_SUBSCRIBER_CONFIG,
  ZMQ_PUBSUB_DEFAULT_TOPIC,
  ZMQ_PUBSUB_DEFAULT_USE_ATTRIBUTES,
  ZMQ_PUBSUB_DEFAULT_CHECK_EXISTENCE,
} from './zmq.constants.js';
import { ZMQPubSubOptions } from './zmq.interfaces.js';
// import { closePubSub, closeSubscription, flushTopic } from './gc-pubsub.utils';

/*
 * README
 * A ClientProxy implementation for ZeroMQ 'PubSub'
 */

export class ZMQPubSubClient extends ClientProxy {
  protected readonly logger = new Logger(ZMQPubSubClient.name);

  protected readonly topicName: string;
  protected readonly publisherConfig: Record<string, any>; // PublishOptions;
  protected readonly replyTopicName?: string;
  protected readonly replySubscriptionName?: string;
  protected readonly clientConfig: ClientConfig;
  protected readonly subscriberConfig: Record<string, any>; // SubscriberOptions;
  protected readonly noAck: boolean;
  // protected readonly useAttributes: boolean; // we don't use attributes for now

  protected client: zmq.Socket | null = null; // PubSub | null = null;
  protected isConnected = false;
  // protected replySubscription: Subscription | null = null;
  // protected topic: string | null = null; // Topic | null = null;
  protected init: boolean;
  // protected readonly checkExistence: boolean; // we don't need to check existence

  constructor(protected readonly options: ZMQPubSubOptions) {
    super();
    this.clientConfig = this.options.client || ZMQ_PUBSUB_DEFAULT_CLIENT_CONFIG;
    this.topicName = this.options.topic || ZMQ_PUBSUB_DEFAULT_TOPIC;
    this.subscriberConfig =
      this.options.subscriber || ZMQ_PUBSUB_DEFAULT_SUBSCRIBER_CONFIG;
    this.publisherConfig =
      this.options.publisher || ZMQ_PUBSUB_DEFAULT_PUBLISHER_CONFIG;
    this.replyTopicName = this.options.replyTopic;
    this.replySubscriptionName = this.options.replySubscription;
    this.noAck = this.options.noAck ?? ZMQ_PUBSUB_DEFAULT_NO_ACK;
    this.init = this.options.init ?? ZMQ_PUBSUB_DEFAULT_INIT;
    // this.useAttributes =
    //   this.options.useAttributes ?? ZMQ_PUBSUB_DEFAULT_USE_ATTRIBUTES;
    // this.checkExistence =
    //   this.options.checkExistence ?? ZMQ_PUBSUB_DEFAULT_CHECK_EXISTENCE;
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  public async close(): Promise<void> {
    // await flushTopic(this.topic);
    // await closeSubscription(this.replySubscription);
    // await closePubSub(this.client);
    this.unbindEvents();
    this.client.close();
    this.isConnected = false;
    this.client = null;
    // this.topic = null;
    // this.replySubscription = null;
  }

  async connect(): Promise<zmq.Socket> {
    if (this.client) {
      return this.client;
    }
    this.client = this.createClient();
    this.bindEvents();
    // this.topic = this.client.topic(this.topicName, this.publisherConfig);

    // MANAGE TOPIC existance
    // if (this.checkExistence) {
    //   const [topicExists] = await this.topic.exists();
    //   if (!topicExists) {
    //     const message = `PubSub client is not connected: topic ${this.topicName} does not exist`;
    //     this.logger.error(message);
    //     throw new Error(message);
    //   }
    // }

    // MANAGE REPLY TOPIC
    // if (this.replyTopicName && this.replySubscriptionName) {
    //   const replyTopic = this.client.topic(this.replyTopicName);
    //   if (this.init) {
    //     await this.createIfNotExists(replyTopic.create.bind(replyTopic));
    //   } else if (this.checkExistence) {
    //     const [exists] = await replyTopic.exists();
    //     if (!exists) {
    //       const message = `PubSub client is not connected: topic ${this.replyTopicName} does not exist`;
    //       this.logger.error(message);
    //       throw new Error(message);
    //     }
    //   }
    //   this.replySubscription = replyTopic.subscription(
    //     this.replySubscriptionName,
    //     this.subscriberConfig,
    //   );
    //   if (this.init) {
    //     await this.createIfNotExists(
    //       this.replySubscription.create.bind(this.replySubscription),
    //     );
    //   } else if (this.checkExistence) {
    //     const [exists] = await this.replySubscription.exists();
    //     if (!exists) {
    //       const message = `PubSub client is not connected: subscription ${this.replySubscription} does not exist`;
    //       this.logger.error(message);
    //       throw new Error(message);
    //     }
    //   }
    //   this.replySubscription
    //     .on(MESSAGE_EVENT, async (message: Message) => {
    //       try {
    //         const isHandled = await this.handleResponse(message);
    //         if (!isHandled) {
    //           message.nack();
    //         } else if (this.noAck) {
    //           message.ack();
    //         }
    //       } catch (error) {
    //         this.logger.error(error);
    //         if (this.noAck) {
    //           message.nack();
    //         }
    //       }
    //     })
    //     .on(ERROR_EVENT, (err: any) => this.logger.error(err));
    // }

    return this.client;
  }

  private logEvent(event: string) {
    this.logger.debug(`logEvent: ${event}`);
  }
  private bindEvents() {
    this.client.on('listen', () => this.logEvent('listen'));
    this.client.on('accept', () => this.logEvent('accept'));
    this.client.on('disconnect', () => this.logEvent('disconnect'));
  }
  private unbindEvents() {
    this.client.off('listen', () => this.logEvent('listen'));
    this.client.off('accept', () => this.logEvent('accept'));
    this.client.off('disconnect', () => this.logEvent('disconnect'));
  }

  public createClient(): zmq.Socket {
    const url =
      this.clientConfig.url ||
      `tcp://${this.clientConfig.host}:${this.clientConfig.host}`;
    const client = zmq.socket('pub');
    try {
      client.connect(url);
      this.isConnected = true;
    } catch (error) {
      console.log(error);
    }
    return client;
  }

  /**
   * Send a message to the topic, no response expected
   */
  protected async dispatchEvent(packet: ReadPacket): Promise<any> {
    const pattern = this.normalizePattern(packet.pattern);
    // if (!this.topic) {
    //   return;
    // }
    if (!this.isConnected) {
      this.logger.error('MQPubSub client is not connected');
      return;
    }
    const serializedPacket = this.serializer.serialize({
      ...packet,
      pattern,
    });
    // if (this.useAttributes) {
    //   // await this.topic.publishMessage({
    //   this.client.send(
    //     JSON.stringify({
    //       json: serializedPacket.data,
    //       attributes: {
    //         pattern: serializedPacket.pattern,
    //       },
    //     }),
    //   );
    // } else {
      // await this.topic.publishMessage({ json: serializedPacket });
      this.client.send(JSON.stringify(serializedPacket));
    // }
  }

  /**
   * Publishes a message to the topic, response will be handled by the [...WHAT???] subscription
   * @param partialPacket
   * @param callback
   */
  protected publish(
    partialPacket: ReadPacket,
    callback: (packet: WritePacket) => void,
  ) {
    try {
      const packet = this.assignPacketId(partialPacket);

      const serializedPacket = this.serializer.serialize(packet);
      this.routingMap.set(packet.id, callback);

      // if (this.topic) {
      //   if (this.useAttributes) {
      //     this.topic
      //       .publishMessage({
      //         json: serializedPacket.data,
      //         attributes: {
      //           replyTo: this.replyTopicName,
      //           pattern: serializedPacket.pattern,
      //           id: serializedPacket.id,
      //         },
      //       })
      //       .catch((err) => callback({ err }));
      //   } else {
      //     this.topic
      //       .publishMessage({
      //         json: serializedPacket,
      //         attributes: { replyTo: this.replyTopicName },
      //       })
      //       .catch((err) => callback({ err }));
      //   }
      // } else {
      //   callback({ err: new Error('Topic is not created') });
      // }
      if (this.topicName) {
        this.client.send([this.topicName, JSON.stringify(serializedPacket)]);
      } else {
        this.client.send(JSON.stringify(serializedPacket));
      }

      return () => this.routingMap.delete(packet.id);
    } catch (err) {
      callback({ err });
    }
  }

  /**
   * A resonse is received from the subscription to the reply topic
   */
  public async handleResponse(message: {
    data: Buffer;
    attributes: Record<string, string>;
  }): Promise<boolean> {
    const rawMessage = JSON.parse(message.data.toString());
    const { err, response, isDisposed, id } = this.deserializer.deserialize(
      rawMessage,
    ) as IncomingResponse;
    const correlationId = message.attributes.id || id;
    const callback = this.routingMap.get(correlationId);
    if (!callback) {
      return false;
    }
    if (err || isDisposed) {
      callback({
        err,
        response,
        isDisposed,
      });
    } else {
      callback({
        err,
        response,
      });
    }
    return true;
  }

  public async createIfNotExists(create: () => Promise<any>) {
    try {
      await create();
    } catch (error: any) {
      if (error.code !== ALREADY_EXISTS) {
        throw error;
      }
    }
  }
}
