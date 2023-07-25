/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, AttachmentData, ConversationParameters, StatusCodes, Transcript } from '@microsoft/teams-connector/src/schema';

import type { ChannelServiceHandlerBase } from './channelServiceHandlerBase';
import { StatusCodeError } from './statusCodeError';
import { WebRequest, WebResponse } from './interfaces';

export type RouteHandler = (request: WebRequest, response: WebResponse) => void;

import { validateAndFixActivity } from './activityValidator';

import { RouteConstants } from './routeConstants';

/**
 * Interface representing an Express Application or a Restify Server.
 */
export interface WebServer {
    get: (path: string, handler: RouteHandler) => void;
    post: (path: string, handler: RouteHandler) => void;
    put: (path: string, handler: RouteHandler) => void;
    // For the DELETE HTTP Method, we need two optional methods:
    //  - Express 4.x has delete() - https://expressjs.com/en/4x/api.html#app.delete.method
    //  - restify has del() - http://restify.com/docs/server-api/#del
    del?: (path: string, handler: RouteHandler) => void;
    delete?: (path: string, handler: RouteHandler) => void;
}

/**
 * Routes the API calls with the ChannelServiceHandler methods.
 */
export class ChannelServiceRoutes {
    /**
     * @param channelServiceHandler The channel service handler.
     */
    constructor(private readonly channelServiceHandler: ChannelServiceHandlerBase) {}

    /**
     * Registers all Channel Service paths on the provided WebServer.
     *
     * @param server WebServer
     * @param basePath Optional basePath which is appended before the service's REST API is configured on the WebServer.
     */
    register(server: WebServer, basePath = ''): void {
        server.post(basePath + RouteConstants.Activities, this.processSendToConversation.bind(this));
        server.post(basePath + RouteConstants.Activity, this.processReplyToActivity.bind(this));
        server.put(basePath + RouteConstants.Activity, this.processUpdateActivity.bind(this));
        server.get(basePath + RouteConstants.ActivityMembers, this.processGetActivityMembers.bind(this));
        server.post(basePath + RouteConstants.Conversations, this.processCreateConversation.bind(this));
        server.get(basePath + RouteConstants.Conversations, this.processGetConversations.bind(this));
        server.get(basePath + RouteConstants.ConversationMembers, this.processGetConversationMembers.bind(this));
        server.get(basePath + RouteConstants.ConversationMember, this.processGetConversationMember.bind(this));
        server.get(
            basePath + RouteConstants.ConversationPagedMembers,
            this.processGetConversationPagedMembers.bind(this)
        );
        server.post(basePath + RouteConstants.ConversationHistory, this.processSendConversationHistory.bind(this));
        server.post(basePath + RouteConstants.Attachments, this.processUploadAttachment.bind(this));

        // Express 4.x uses the delete() method to register handlers for the DELETE method.
        // Restify 8.x uses the del() method.
        if (typeof server.delete === 'function') {
            server.delete(
                basePath + RouteConstants.ConversationMember,
                this.processDeleteConversationMember.bind(this)
            );
            server.delete(basePath + RouteConstants.Activity, this.processDeleteActivity.bind(this));
        } else if (typeof server.del === 'function') {
            server.del(basePath + RouteConstants.ConversationMember, this.processDeleteConversationMember.bind(this));
            server.del(basePath + RouteConstants.Activity, this.processDeleteActivity.bind(this));
        }
    }

    /**
     * @private
     */
    private processSendToConversation(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readActivity(req)
            .then((activity) => {
                this.channelServiceHandler
                    .handleSendToConversation(authHeader, req.params.conversationId, activity)
                    .then((resourceResponse) => {
                        res.status(200);
                        if (resourceResponse) {
                            res.send(resourceResponse);
                        }
                        res.end();
                    })
                    .catch((err) => {
                        ChannelServiceRoutes.handleError(err, res);
                    });
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processReplyToActivity(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readActivity(req)
            .then((activity) => {
                this.channelServiceHandler
                    .handleReplyToActivity(authHeader, req.params.conversationId, req.params.activityId, activity)
                    .then((resourceResponse) => {
                        res.status(200);
                        if (resourceResponse) {
                            res.send(resourceResponse);
                        }
                        res.end();
                    })
                    .catch((err) => {
                        ChannelServiceRoutes.handleError(err, res);
                    });
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processUpdateActivity(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readActivity(req)
            .then((activity) => {
                this.channelServiceHandler
                    .handleUpdateActivity(authHeader, req.params.conversationId, req.params.activityId, activity)
                    .then((resourceResponse) => {
                        res.status(200);
                        if (resourceResponse) {
                            res.send(resourceResponse);
                        }
                        res.end();
                    })
                    .catch((err) => {
                        ChannelServiceRoutes.handleError(err, res);
                    });
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processDeleteActivity(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleDeleteActivity(authHeader, req.params.conversationId, req.params.activityId)
            .then(() => {
                res.status(200);
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processGetActivityMembers(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleGetActivityMembers(authHeader, req.params.conversationId, req.params.activityId)
            .then((channelAccounts) => {
                if (channelAccounts) {
                    res.send(channelAccounts);
                }
                res.status(200);
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processCreateConversation(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readBody<ConversationParameters>(req).then((conversationParameters) => {
            this.channelServiceHandler
                .handleCreateConversation(authHeader, conversationParameters)
                .then((conversationResourceResponse) => {
                    if (conversationResourceResponse) {
                        res.send(conversationResourceResponse);
                    }
                    res.status(201);
                    res.end();
                })
                .catch((err) => {
                    ChannelServiceRoutes.handleError(err, res);
                });
        });
    }

    /**
     * @private
     */
    private processGetConversations(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleGetConversations(authHeader, req.params.conversationId, req.query.continuationToken)
            .then((conversationsResult) => {
                if (conversationsResult) {
                    res.send(conversationsResult);
                }
                res.status(200);
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processGetConversationMembers(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleGetConversationMembers(authHeader, req.params.conversationId)
            .then((channelAccounts) => {
                res.status(200);
                if (channelAccounts) {
                    res.send(channelAccounts);
                }
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processGetConversationMember(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleGetConversationMember(authHeader, req.params.memberId, req.params.conversationId)
            .then((channelAccount) => {
                res.status(200);
                if (channelAccount) {
                    res.send(channelAccount);
                }
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processGetConversationPagedMembers(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        let pageSize: number|undefined = parseInt(req.query.pageSize);
        if (isNaN(pageSize)) {
            pageSize = undefined;
        }
        this.channelServiceHandler
            .handleGetConversationPagedMembers(
                authHeader,
                req.params.conversationId,
                pageSize,
                req.query.continuationToken
            )
            .then((pagedMembersResult) => {
                res.status(200);
                if (pagedMembersResult) {
                    res.send(pagedMembersResult);
                }
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processDeleteConversationMember(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        this.channelServiceHandler
            .handleDeleteConversationMember(authHeader, req.params.conversationId, req.params.memberId)
            .then(() => {
                res.status(200);
                res.end();
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processSendConversationHistory(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readBody<Transcript>(req)
            .then((transcript) => {
                this.channelServiceHandler
                    .handleSendConversationHistory(authHeader, req.params.conversationId, transcript)
                    .then((resourceResponse) => {
                        if (resourceResponse) {
                            res.send(resourceResponse);
                        }
                        res.status(200);
                        res.end();
                    })
                    .catch((err) => {
                        ChannelServiceRoutes.handleError(err, res);
                    });
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private processUploadAttachment(req: WebRequest, res: WebResponse): void {
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        ChannelServiceRoutes.readBody<AttachmentData>(req)
            .then((attachmentData) => {
                this.channelServiceHandler
                    .handleUploadAttachment(authHeader, req.params.conversationId, attachmentData)
                    .then((resourceResponse) => {
                        if (resourceResponse) {
                            res.send(resourceResponse);
                        }
                        res.status(200);
                        res.end();
                    })
                    .catch((err) => {
                        ChannelServiceRoutes.handleError(err, res);
                    });
            })
            .catch((err) => {
                ChannelServiceRoutes.handleError(err, res);
            });
    }

    /**
     * @private
     */
    private static readActivity(req: WebRequest): Promise<Activity> {
        return new Promise((resolve, reject) => {
            if (req.body) {
                try {
                    const activity = validateAndFixActivity(req.body);
                    resolve(activity);
                } catch (err: unknown) {
                    reject(new StatusCodeError(StatusCodes.BAD_REQUEST, (err as Error).message));
                }
            } else {
                let requestData = '';
                req.on!('data', (chunk: string) => {
                    requestData += chunk;
                });
                req.on!('end', () => {
                    try {
                        const body = JSON.parse(requestData);
                        const activity = validateAndFixActivity(body);
                        resolve(activity);
                    } catch (err: unknown) {
                        reject(new StatusCodeError(StatusCodes.BAD_REQUEST, (err as Error).message));
                    }
                });
            }
        });
    }

    /**
     * @private
     */
    private static readBody<T>(req: WebRequest): Promise<T> {
        return new Promise((resolve, reject) => {
            if (req.body) {
                try {
                    resolve(req.body);
                } catch (err: unknown) {
                    reject(new StatusCodeError(StatusCodes.BAD_REQUEST, (err as Error).message));
                }
            } else {
                let requestData = '';
                // eslint-disable-next-line prettier/prettier
                req.on!('data', (chunk: string) => { // lgtm[js/stack-trace-exposure]
                    requestData += chunk;
                });
                req.on!('end', () => {
                    try {
                        const body = JSON.parse(requestData);
                        resolve(body);
                    } catch (err: unknown) {
                        reject(new StatusCodeError(StatusCodes.BAD_REQUEST, (err as Error).message));
                    }
                });
            }
        });
    }

    /**
     * @private
     */
    private static handleError(err: any, res: WebResponse): void {
        res.status(typeof err?.statusCode === 'number' ? err.statusCode : 500);
        res.send(err instanceof Error ? (err as Error).message : err);
        res.end();
    }
}
