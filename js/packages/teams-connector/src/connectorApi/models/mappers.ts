/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";


export const AttachmentView: msRest.CompositeMapper = {
  serializedName: "AttachmentView",
  type: {
    name: "Composite",
    className: "AttachmentView",
    modelProperties: {
      viewId: {
        serializedName: "viewId",
        type: {
          name: "String"
        }
      },
      size: {
        serializedName: "size",
        type: {
          name: "Number"
        }
      }
    }
  }
};

export const AttachmentInfo: msRest.CompositeMapper = {
  serializedName: "AttachmentInfo",
  type: {
    name: "Composite",
    className: "AttachmentInfo",
    modelProperties: {
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      views: {
        serializedName: "views",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "AttachmentView"
            }
          }
        }
      }
    }
  }
};

export const InnerHttpError: msRest.CompositeMapper = {
  serializedName: "InnerHttpError",
  type: {
    name: "Composite",
    className: "InnerHttpError",
    modelProperties: {
      statusCode: {
        serializedName: "statusCode",
        type: {
          name: "Number"
        }
      },
      body: {
        serializedName: "body",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const ErrorModel: msRest.CompositeMapper = {
  serializedName: "Error",
  type: {
    name: "Composite",
    className: "ErrorModel",
    modelProperties: {
      code: {
        serializedName: "code",
        type: {
          name: "String"
        }
      },
      message: {
        serializedName: "message",
        type: {
          name: "String"
        }
      },
      innerHttpError: {
        serializedName: "innerHttpError",
        type: {
          name: "Composite",
          className: "InnerHttpError"
        }
      }
    }
  }
};

export const ErrorResponse: msRest.CompositeMapper = {
  serializedName: "ErrorResponse",
  type: {
    name: "Composite",
    className: "ErrorResponse",
    modelProperties: {
      error: {
        serializedName: "error",
        type: {
          name: "Composite",
          className: "ErrorModel"
        }
      }
    }
  }
};

export const ChannelAccount: msRest.CompositeMapper = {
  serializedName: "ChannelAccount",
  type: {
    name: "Composite",
    className: "ChannelAccount",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      aadObjectId: {
        serializedName: "aadObjectId",
        type: {
          name: "String"
        }
      },
      role: {
        serializedName: "role",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const ConversationAccount: msRest.CompositeMapper = {
  serializedName: "ConversationAccount",
  type: {
    name: "Composite",
    className: "ConversationAccount",
    modelProperties: {
      isGroup: {
        serializedName: "isGroup",
        type: {
          name: "Boolean"
        }
      },
      conversationType: {
        serializedName: "conversationType",
        type: {
          name: "String"
        }
      },
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      aadObjectId: {
        serializedName: "aadObjectId",
        type: {
          name: "String"
        }
      },
      role: {
        serializedName: "role",
        type: {
          name: "String"
        }
      },
      tenantId: {
        serializedName: "tenantId",
        type: {
          name: "String"
        }
      },
      properties: {
        serializedName: "properties",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const MessageReaction: msRest.CompositeMapper = {
  serializedName: "MessageReaction",
  type: {
    name: "Composite",
    className: "MessageReaction",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const CardAction: msRest.CompositeMapper = {
  serializedName: "CardAction",
  type: {
    name: "Composite",
    className: "CardAction",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      displayText: {
        serializedName: "displayText",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      },
      channelData: {
        serializedName: "channelData",
        type: {
          name: "Object"
        }
      },
      imageAltText: {
        serializedName: "imageAltText",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const SuggestedActions: msRest.CompositeMapper = {
  serializedName: "SuggestedActions",
  type: {
    name: "Composite",
    className: "SuggestedActions",
    modelProperties: {
      to: {
        serializedName: "to",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      actions: {
        serializedName: "actions",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      }
    }
  }
};

export const Attachment: msRest.CompositeMapper = {
  serializedName: "Attachment",
  type: {
    name: "Composite",
    className: "Attachment",
    modelProperties: {
      contentType: {
        serializedName: "contentType",
        type: {
          name: "String"
        }
      },
      contentUrl: {
        serializedName: "contentUrl",
        type: {
          name: "String"
        }
      },
      content: {
        serializedName: "content",
        type: {
          name: "Object"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      thumbnailUrl: {
        serializedName: "thumbnailUrl",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const Entity: msRest.CompositeMapper = {
  serializedName: "Entity",
  type: {
    name: "Composite",
    className: "Entity",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      mentioned: {
        serializedName: "mentioned",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      }
    }
  }
};

export const ConversationReference: msRest.CompositeMapper = {
  serializedName: "ConversationReference",
  type: {
    name: "Composite",
    className: "ConversationReference",
    modelProperties: {
      activityId: {
        serializedName: "activityId",
        type: {
          name: "String"
        }
      },
      user: {
        serializedName: "user",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      bot: {
        serializedName: "bot",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      conversation: {
        serializedName: "conversation",
        type: {
          name: "Composite",
          className: "ConversationAccount"
        }
      },
      channelId: {
        serializedName: "channelId",
        type: {
          name: "String"
        }
      },
      serviceUrl: {
        serializedName: "serviceUrl",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const TextHighlight: msRest.CompositeMapper = {
  serializedName: "TextHighlight",
  type: {
    name: "Composite",
    className: "TextHighlight",
    modelProperties: {
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      occurrence: {
        serializedName: "occurrence",
        type: {
          name: "Number"
        }
      }
    }
  }
};

export const SemanticAction: msRest.CompositeMapper = {
  serializedName: "SemanticAction",
  type: {
    name: "Composite",
    className: "SemanticAction",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      state: {
        serializedName: "state",
        type: {
          name: "String"
        }
      },
      entities: {
        serializedName: "entities",
        type: {
          name: "Dictionary",
          value: {
            type: {
              name: "Composite",
              className: "Entity"
            }
          }
        }
      }
    }
  }
};

export const Activity: msRest.CompositeMapper = {
  serializedName: "Activity",
  type: {
    name: "Composite",
    className: "Activity",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      timestamp: {
        serializedName: "timestamp",
        type: {
          name: "DateTime"
        }
      },
      localTimestamp: {
        serializedName: "localTimestamp",
        type: {
          name: "DateTime"
        }
      },
      localTimezone: {
        serializedName: "localTimezone",
        type: {
          name: "String"
        }
      },
      callerId: {
        serializedName: "callerId",
        type: {
          name: "String"
        }
      },
      serviceUrl: {
        serializedName: "serviceUrl",
        type: {
          name: "String"
        }
      },
      channelId: {
        serializedName: "channelId",
        type: {
          name: "String"
        }
      },
      from: {
        serializedName: "from",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      conversation: {
        serializedName: "conversation",
        type: {
          name: "Composite",
          className: "ConversationAccount"
        }
      },
      recipient: {
        serializedName: "recipient",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      textFormat: {
        serializedName: "textFormat",
        type: {
          name: "String"
        }
      },
      attachmentLayout: {
        serializedName: "attachmentLayout",
        type: {
          name: "String"
        }
      },
      membersAdded: {
        serializedName: "membersAdded",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      },
      membersRemoved: {
        serializedName: "membersRemoved",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      },
      reactionsAdded: {
        serializedName: "reactionsAdded",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MessageReaction"
            }
          }
        }
      },
      reactionsRemoved: {
        serializedName: "reactionsRemoved",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MessageReaction"
            }
          }
        }
      },
      topicName: {
        serializedName: "topicName",
        type: {
          name: "String"
        }
      },
      historyDisclosed: {
        serializedName: "historyDisclosed",
        type: {
          name: "Boolean"
        }
      },
      locale: {
        serializedName: "locale",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      speak: {
        serializedName: "speak",
        type: {
          name: "String"
        }
      },
      inputHint: {
        serializedName: "inputHint",
        type: {
          name: "String"
        }
      },
      summary: {
        serializedName: "summary",
        type: {
          name: "String"
        }
      },
      suggestedActions: {
        serializedName: "suggestedActions",
        type: {
          name: "Composite",
          className: "SuggestedActions"
        }
      },
      attachments: {
        serializedName: "attachments",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Attachment"
            }
          }
        }
      },
      entities: {
        serializedName: "entities",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Entity",
              additionalProperties: {
                type: {
                  name: "Object"
                }
              }
            }
          }
        }
      },
      channelData: {
        serializedName: "channelData",
        type: {
          name: "Object"
        }
      },
      action: {
        serializedName: "action",
        type: {
          name: "String"
        }
      },
      replyToId: {
        serializedName: "replyToId",
        type: {
          name: "String"
        }
      },
      label: {
        serializedName: "label",
        type: {
          name: "String"
        }
      },
      valueType: {
        serializedName: "valueType",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      relatesTo: {
        serializedName: "relatesTo",
        type: {
          name: "Composite",
          className: "ConversationReference"
        }
      },
      code: {
        serializedName: "code",
        type: {
          name: "String"
        }
      },
      expiration: {
        serializedName: "expiration",
        type: {
          name: "DateTime"
        }
      },
      importance: {
        serializedName: "importance",
        type: {
          name: "String"
        }
      },
      deliveryMode: {
        serializedName: "deliveryMode",
        type: {
          name: "String"
        }
      },
      listenFor: {
        serializedName: "listenFor",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      textHighlights: {
        serializedName: "textHighlights",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "TextHighlight"
            }
          }
        }
      },
      semanticAction: {
        serializedName: "semanticAction",
        type: {
          name: "Composite",
          className: "SemanticAction"
        }
      }
    }
  }
};

export const ConversationParameters: msRest.CompositeMapper = {
  serializedName: "ConversationParameters",
  type: {
    name: "Composite",
    className: "ConversationParameters",
    modelProperties: {
      isGroup: {
        serializedName: "isGroup",
        type: {
          name: "Boolean"
        }
      },
      bot: {
        serializedName: "bot",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      members: {
        serializedName: "members",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      },
      topicName: {
        serializedName: "topicName",
        type: {
          name: "String"
        }
      },
      tenantId: {
        serializedName: "tenantId",
        type: {
          name: "String"
        }
      },
      activity: {
        serializedName: "activity",
        type: {
          name: "Composite",
          className: "Activity"
        }
      },
      channelData: {
        serializedName: "channelData",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const ConversationResourceResponse: msRest.CompositeMapper = {
  serializedName: "ConversationResourceResponse",
  type: {
    name: "Composite",
    className: "ConversationResourceResponse",
    modelProperties: {
      activityId: {
        serializedName: "activityId",
        type: {
          name: "String"
        }
      },
      serviceUrl: {
        serializedName: "serviceUrl",
        type: {
          name: "String"
        }
      },
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const ConversationMembers: msRest.CompositeMapper = {
  serializedName: "ConversationMembers",
  type: {
    name: "Composite",
    className: "ConversationMembers",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      members: {
        serializedName: "members",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      }
    }
  }
};

export const ConversationsResult: msRest.CompositeMapper = {
  serializedName: "ConversationsResult",
  type: {
    name: "Composite",
    className: "ConversationsResult",
    modelProperties: {
      continuationToken: {
        serializedName: "continuationToken",
        type: {
          name: "String"
        }
      },
      conversations: {
        serializedName: "conversations",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ConversationMembers"
            }
          }
        }
      }
    }
  }
};

export const ExpectedReplies: msRest.CompositeMapper = {
  serializedName: "ExpectedReplies",
  type: {
    name: "Composite",
    className: "ExpectedReplies",
    modelProperties: {
      activities: {
        serializedName: "activities",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Activity"
            }
          }
        }
      }
    }
  }
};

export const ResourceResponse: msRest.CompositeMapper = {
  serializedName: "ResourceResponse",
  type: {
    name: "Composite",
    className: "ResourceResponse",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const Transcript: msRest.CompositeMapper = {
  serializedName: "Transcript",
  type: {
    name: "Composite",
    className: "Transcript",
    modelProperties: {
      activities: {
        serializedName: "activities",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Activity"
            }
          }
        }
      }
    }
  }
};

export const PagedMembersResult: msRest.CompositeMapper = {
  serializedName: "PagedMembersResult",
  type: {
    name: "Composite",
    className: "PagedMembersResult",
    modelProperties: {
      continuationToken: {
        serializedName: "continuationToken",
        type: {
          name: "String"
        }
      },
      members: {
        serializedName: "members",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      }
    }
  }
};

export const AttachmentData: msRest.CompositeMapper = {
  serializedName: "AttachmentData",
  type: {
    name: "Composite",
    className: "AttachmentData",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      },
      originalBase64: {
        serializedName: "originalBase64",
        type: {
          name: "ByteArray"
        }
      },
      thumbnailBase64: {
        serializedName: "thumbnailBase64",
        type: {
          name: "ByteArray"
        }
      }
    }
  }
};

export const CardImage: msRest.CompositeMapper = {
  serializedName: "CardImage",
  type: {
    name: "Composite",
    className: "CardImage",
    modelProperties: {
      url: {
        serializedName: "url",
        type: {
          name: "String"
        }
      },
      alt: {
        serializedName: "alt",
        type: {
          name: "String"
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      }
    }
  }
};

export const HeroCard: msRest.CompositeMapper = {
  serializedName: "HeroCard",
  type: {
    name: "Composite",
    className: "HeroCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      images: {
        serializedName: "images",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardImage"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      }
    }
  }
};

export const ThumbnailUrl: msRest.CompositeMapper = {
  serializedName: "ThumbnailUrl",
  type: {
    name: "Composite",
    className: "ThumbnailUrl",
    modelProperties: {
      url: {
        serializedName: "url",
        type: {
          name: "String"
        }
      },
      alt: {
        serializedName: "alt",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const MediaUrl: msRest.CompositeMapper = {
  serializedName: "MediaUrl",
  type: {
    name: "Composite",
    className: "MediaUrl",
    modelProperties: {
      url: {
        serializedName: "url",
        type: {
          name: "String"
        }
      },
      profile: {
        serializedName: "profile",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const AnimationCard: msRest.CompositeMapper = {
  serializedName: "AnimationCard",
  type: {
    name: "Composite",
    className: "AnimationCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "Composite",
          className: "ThumbnailUrl"
        }
      },
      media: {
        serializedName: "media",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MediaUrl"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      shareable: {
        serializedName: "shareable",
        type: {
          name: "Boolean"
        }
      },
      autoloop: {
        serializedName: "autoloop",
        type: {
          name: "Boolean"
        }
      },
      autostart: {
        serializedName: "autostart",
        type: {
          name: "Boolean"
        }
      },
      aspect: {
        serializedName: "aspect",
        type: {
          name: "String"
        }
      },
      duration: {
        serializedName: "duration",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const AudioCard: msRest.CompositeMapper = {
  serializedName: "AudioCard",
  type: {
    name: "Composite",
    className: "AudioCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "Composite",
          className: "ThumbnailUrl"
        }
      },
      media: {
        serializedName: "media",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MediaUrl"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      shareable: {
        serializedName: "shareable",
        type: {
          name: "Boolean"
        }
      },
      autoloop: {
        serializedName: "autoloop",
        type: {
          name: "Boolean"
        }
      },
      autostart: {
        serializedName: "autostart",
        type: {
          name: "Boolean"
        }
      },
      aspect: {
        serializedName: "aspect",
        type: {
          name: "String"
        }
      },
      duration: {
        serializedName: "duration",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const BasicCard: msRest.CompositeMapper = {
  serializedName: "BasicCard",
  type: {
    name: "Composite",
    className: "BasicCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      images: {
        serializedName: "images",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardImage"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      }
    }
  }
};

export const MediaCard: msRest.CompositeMapper = {
  serializedName: "MediaCard",
  type: {
    name: "Composite",
    className: "MediaCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "Composite",
          className: "ThumbnailUrl"
        }
      },
      media: {
        serializedName: "media",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MediaUrl"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      shareable: {
        serializedName: "shareable",
        type: {
          name: "Boolean"
        }
      },
      autoloop: {
        serializedName: "autoloop",
        type: {
          name: "Boolean"
        }
      },
      autostart: {
        serializedName: "autostart",
        type: {
          name: "Boolean"
        }
      },
      aspect: {
        serializedName: "aspect",
        type: {
          name: "String"
        }
      },
      duration: {
        serializedName: "duration",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const Fact: msRest.CompositeMapper = {
  serializedName: "Fact",
  type: {
    name: "Composite",
    className: "Fact",
    modelProperties: {
      key: {
        serializedName: "key",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const ReceiptItem: msRest.CompositeMapper = {
  serializedName: "ReceiptItem",
  type: {
    name: "Composite",
    className: "ReceiptItem",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "Composite",
          className: "CardImage"
        }
      },
      price: {
        serializedName: "price",
        type: {
          name: "String"
        }
      },
      quantity: {
        serializedName: "quantity",
        type: {
          name: "String"
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      }
    }
  }
};

export const ReceiptCard: msRest.CompositeMapper = {
  serializedName: "ReceiptCard",
  type: {
    name: "Composite",
    className: "ReceiptCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      facts: {
        serializedName: "facts",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "Fact"
            }
          }
        }
      },
      items: {
        serializedName: "items",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ReceiptItem"
            }
          }
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      },
      total: {
        serializedName: "total",
        type: {
          name: "String"
        }
      },
      tax: {
        serializedName: "tax",
        type: {
          name: "String"
        }
      },
      vat: {
        serializedName: "vat",
        type: {
          name: "String"
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      }
    }
  }
};

export const SigninCard: msRest.CompositeMapper = {
  serializedName: "SigninCard",
  type: {
    name: "Composite",
    className: "SigninCard",
    modelProperties: {
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      }
    }
  }
};

export const OAuthCard: msRest.CompositeMapper = {
  serializedName: "OAuthCard",
  type: {
    name: "Composite",
    className: "OAuthCard",
    modelProperties: {
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      connectionName: {
        serializedName: "connectionName",
        type: {
          name: "String"
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      }
    }
  }
};

export const ThumbnailCard: msRest.CompositeMapper = {
  serializedName: "ThumbnailCard",
  type: {
    name: "Composite",
    className: "ThumbnailCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      images: {
        serializedName: "images",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardImage"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      tap: {
        serializedName: "tap",
        type: {
          name: "Composite",
          className: "CardAction"
        }
      }
    }
  }
};

export const VideoCard: msRest.CompositeMapper = {
  serializedName: "VideoCard",
  type: {
    name: "Composite",
    className: "VideoCard",
    modelProperties: {
      title: {
        serializedName: "title",
        type: {
          name: "String"
        }
      },
      subtitle: {
        serializedName: "subtitle",
        type: {
          name: "String"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      image: {
        serializedName: "image",
        type: {
          name: "Composite",
          className: "ThumbnailUrl"
        }
      },
      media: {
        serializedName: "media",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "MediaUrl"
            }
          }
        }
      },
      buttons: {
        serializedName: "buttons",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "CardAction"
            }
          }
        }
      },
      shareable: {
        serializedName: "shareable",
        type: {
          name: "Boolean"
        }
      },
      autoloop: {
        serializedName: "autoloop",
        type: {
          name: "Boolean"
        }
      },
      autostart: {
        serializedName: "autostart",
        type: {
          name: "Boolean"
        }
      },
      aspect: {
        serializedName: "aspect",
        type: {
          name: "String"
        }
      },
      duration: {
        serializedName: "duration",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const GeoCoordinates: msRest.CompositeMapper = {
  serializedName: "GeoCoordinates",
  type: {
    name: "Composite",
    className: "GeoCoordinates",
    modelProperties: {
      elevation: {
        serializedName: "elevation",
        type: {
          name: "Number"
        }
      },
      latitude: {
        serializedName: "latitude",
        type: {
          name: "Number"
        }
      },
      longitude: {
        serializedName: "longitude",
        type: {
          name: "Number"
        }
      },
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const Mention: msRest.CompositeMapper = {
  serializedName: "Mention",
  type: {
    name: "Composite",
    className: "Mention",
    modelProperties: {
      mentioned: {
        serializedName: "mentioned",
        type: {
          name: "Composite",
          className: "ChannelAccount"
        }
      },
      text: {
        serializedName: "text",
        type: {
          name: "String"
        }
      },
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const Place: msRest.CompositeMapper = {
  serializedName: "Place",
  type: {
    name: "Composite",
    className: "Place",
    modelProperties: {
      address: {
        serializedName: "address",
        type: {
          name: "Object"
        }
      },
      geo: {
        serializedName: "geo",
        type: {
          name: "Object"
        }
      },
      hasMap: {
        serializedName: "hasMap",
        type: {
          name: "Object"
        }
      },
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const Thing: msRest.CompositeMapper = {
  serializedName: "Thing",
  type: {
    name: "Composite",
    className: "Thing",
    modelProperties: {
      type: {
        serializedName: "type",
        type: {
          name: "String"
        }
      },
      name: {
        serializedName: "name",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const MediaEventValue: msRest.CompositeMapper = {
  serializedName: "MediaEventValue",
  type: {
    name: "Composite",
    className: "MediaEventValue",
    modelProperties: {
      cardValue: {
        serializedName: "cardValue",
        type: {
          name: "Object"
        }
      }
    }
  }
};

export const TokenRequest: msRest.CompositeMapper = {
  serializedName: "TokenRequest",
  type: {
    name: "Composite",
    className: "TokenRequest",
    modelProperties: {
      provider: {
        serializedName: "provider",
        type: {
          name: "String"
        }
      },
      settings: {
        serializedName: "settings",
        type: {
          name: "Dictionary",
          value: {
            type: {
              name: "Object"
            }
          }
        }
      }
    }
  }
};

export const TokenResponse: msRest.CompositeMapper = {
  serializedName: "TokenResponse",
  type: {
    name: "Composite",
    className: "TokenResponse",
    modelProperties: {
      channelId: {
        serializedName: "channelId",
        type: {
          name: "String"
        }
      },
      connectionName: {
        serializedName: "connectionName",
        type: {
          name: "String"
        }
      },
      token: {
        serializedName: "token",
        type: {
          name: "String"
        }
      },
      expiration: {
        serializedName: "expiration",
        type: {
          name: "String"
        }
      }
    }
  }
};

export const MicrosoftPayMethodData: msRest.CompositeMapper = {
  serializedName: "MicrosoftPayMethodData",
  type: {
    name: "Composite",
    className: "MicrosoftPayMethodData",
    modelProperties: {
      merchantId: {
        serializedName: "merchantId",
        type: {
          name: "String"
        }
      },
      supportedNetworks: {
        serializedName: "supportedNetworks",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      supportedTypes: {
        serializedName: "supportedTypes",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentAddress: msRest.CompositeMapper = {
  serializedName: "PaymentAddress",
  type: {
    name: "Composite",
    className: "PaymentAddress",
    modelProperties: {
      country: {
        serializedName: "country",
        type: {
          name: "String"
        }
      },
      addressLine: {
        serializedName: "addressLine",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      region: {
        serializedName: "region",
        type: {
          name: "String"
        }
      },
      city: {
        serializedName: "city",
        type: {
          name: "String"
        }
      },
      dependentLocality: {
        serializedName: "dependentLocality",
        type: {
          name: "String"
        }
      },
      postalCode: {
        serializedName: "postalCode",
        type: {
          name: "String"
        }
      },
      sortingCode: {
        serializedName: "sortingCode",
        type: {
          name: "String"
        }
      },
      languageCode: {
        serializedName: "languageCode",
        type: {
          name: "String"
        }
      },
      organization: {
        serializedName: "organization",
        type: {
          name: "String"
        }
      },
      recipient: {
        serializedName: "recipient",
        type: {
          name: "String"
        }
      },
      phone: {
        serializedName: "phone",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentCurrencyAmount: msRest.CompositeMapper = {
  serializedName: "PaymentCurrencyAmount",
  type: {
    name: "Composite",
    className: "PaymentCurrencyAmount",
    modelProperties: {
      currency: {
        serializedName: "currency",
        type: {
          name: "String"
        }
      },
      value: {
        serializedName: "value",
        type: {
          name: "String"
        }
      },
      currencySystem: {
        serializedName: "currencySystem",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentItem: msRest.CompositeMapper = {
  serializedName: "PaymentItem",
  type: {
    name: "Composite",
    className: "PaymentItem",
    modelProperties: {
      label: {
        serializedName: "label",
        type: {
          name: "String"
        }
      },
      amount: {
        serializedName: "amount",
        type: {
          name: "Composite",
          className: "PaymentCurrencyAmount"
        }
      },
      pending: {
        serializedName: "pending",
        type: {
          name: "Boolean"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentShippingOption: msRest.CompositeMapper = {
  serializedName: "PaymentShippingOption",
  type: {
    name: "Composite",
    className: "PaymentShippingOption",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      label: {
        serializedName: "label",
        type: {
          name: "String"
        }
      },
      amount: {
        serializedName: "amount",
        type: {
          name: "Composite",
          className: "PaymentCurrencyAmount"
        }
      },
      selected: {
        serializedName: "selected",
        type: {
          name: "Boolean"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentDetailsModifier: msRest.CompositeMapper = {
  serializedName: "PaymentDetailsModifier",
  type: {
    name: "Composite",
    className: "PaymentDetailsModifier",
    modelProperties: {
      supportedMethods: {
        serializedName: "supportedMethods",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      total: {
        serializedName: "total",
        type: {
          name: "Composite",
          className: "PaymentItem"
        }
      },
      additionalDisplayItems: {
        serializedName: "additionalDisplayItems",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "PaymentItem"
            }
          }
        }
      },
      data: {
        serializedName: "data",
        type: {
          name: "Object"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentDetails: msRest.CompositeMapper = {
  serializedName: "PaymentDetails",
  type: {
    name: "Composite",
    className: "PaymentDetails",
    modelProperties: {
      total: {
        serializedName: "total",
        type: {
          name: "Composite",
          className: "PaymentItem"
        }
      },
      displayItems: {
        serializedName: "displayItems",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "PaymentItem"
            }
          }
        }
      },
      shippingOptions: {
        serializedName: "shippingOptions",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "PaymentShippingOption"
            }
          }
        }
      },
      modifiers: {
        serializedName: "modifiers",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "PaymentDetailsModifier"
            }
          }
        }
      },
      error: {
        serializedName: "error",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentMethodData: msRest.CompositeMapper = {
  serializedName: "PaymentMethodData",
  type: {
    name: "Composite",
    className: "PaymentMethodData",
    modelProperties: {
      supportedMethods: {
        serializedName: "supportedMethods",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "String"
            }
          }
        }
      },
      data: {
        serializedName: "data",
        type: {
          name: "Object"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentOptions: msRest.CompositeMapper = {
  serializedName: "PaymentOptions",
  type: {
    name: "Composite",
    className: "PaymentOptions",
    modelProperties: {
      requestPayerName: {
        serializedName: "requestPayerName",
        type: {
          name: "Boolean"
        }
      },
      requestPayerEmail: {
        serializedName: "requestPayerEmail",
        type: {
          name: "Boolean"
        }
      },
      requestPayerPhone: {
        serializedName: "requestPayerPhone",
        type: {
          name: "Boolean"
        }
      },
      requestShipping: {
        serializedName: "requestShipping",
        type: {
          name: "Boolean"
        }
      },
      shippingType: {
        serializedName: "shippingType",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentRequest: msRest.CompositeMapper = {
  serializedName: "PaymentRequest",
  type: {
    name: "Composite",
    className: "PaymentRequest",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      methodData: {
        serializedName: "methodData",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "PaymentMethodData"
            }
          }
        }
      },
      details: {
        serializedName: "details",
        type: {
          name: "Composite",
          className: "PaymentDetails"
        }
      },
      options: {
        serializedName: "options",
        type: {
          name: "Composite",
          className: "PaymentOptions"
        }
      },
      expires: {
        serializedName: "expires",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentResponse: msRest.CompositeMapper = {
  serializedName: "PaymentResponse",
  type: {
    name: "Composite",
    className: "PaymentResponse",
    modelProperties: {
      methodName: {
        serializedName: "methodName",
        type: {
          name: "String"
        }
      },
      details: {
        serializedName: "details",
        type: {
          name: "Object"
        }
      },
      shippingAddress: {
        serializedName: "shippingAddress",
        type: {
          name: "Composite",
          className: "PaymentAddress"
        }
      },
      shippingOption: {
        serializedName: "shippingOption",
        type: {
          name: "String"
        }
      },
      payerEmail: {
        serializedName: "payerEmail",
        type: {
          name: "String"
        }
      },
      payerPhone: {
        serializedName: "payerPhone",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentRequestComplete: msRest.CompositeMapper = {
  serializedName: "PaymentRequestComplete",
  type: {
    name: "Composite",
    className: "PaymentRequestComplete",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      paymentRequest: {
        serializedName: "paymentRequest",
        type: {
          name: "Composite",
          className: "PaymentRequest"
        }
      },
      paymentResponse: {
        serializedName: "paymentResponse",
        type: {
          name: "Composite",
          className: "PaymentResponse"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentRequestCompleteResult: msRest.CompositeMapper = {
  serializedName: "PaymentRequestCompleteResult",
  type: {
    name: "Composite",
    className: "PaymentRequestCompleteResult",
    modelProperties: {
      result: {
        serializedName: "result",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentRequestUpdate: msRest.CompositeMapper = {
  serializedName: "PaymentRequestUpdate",
  type: {
    name: "Composite",
    className: "PaymentRequestUpdate",
    modelProperties: {
      id: {
        serializedName: "id",
        type: {
          name: "String"
        }
      },
      details: {
        serializedName: "details",
        type: {
          name: "Composite",
          className: "PaymentDetails"
        }
      },
      shippingAddress: {
        serializedName: "shippingAddress",
        type: {
          name: "Composite",
          className: "PaymentAddress"
        }
      },
      shippingOption: {
        serializedName: "shippingOption",
        type: {
          name: "String"
        }
      }
    }
  }
};

/**
 * @deprecated Bot Framework no longer supports payments
 */
export const PaymentRequestUpdateResult: msRest.CompositeMapper = {
  serializedName: "PaymentRequestUpdateResult",
  type: {
    name: "Composite",
    className: "PaymentRequestUpdateResult",
    modelProperties: {
      details: {
        serializedName: "details",
        type: {
          name: "Composite",
          className: "PaymentDetails"
        }
      }
    }
  }
};
