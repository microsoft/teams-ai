"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional, Union

from botbuilder.schema import Entity
from msrest.serialization import Model


@dataclass
class AIEntity(Entity):

    _attribute_map = {
        "type": {"key": "type", "type": "str"},
        "type_": {"key": "@type", "type": "str"},
        "context_": {"key": "@context", "type": "str"},
        "id_": {"key": "@id", "type": "str"},
        "additional_type": {"key": "additionalType", "type": "[str]"},
        "citation": {"key": "citation", "type": "[ClientCitation]"},
        "usage_info": {"key": "usageInfo", "type": "SensitivityUsageInfo"},
    }

    additional_type: Optional[list[str]]
    citation: Optional[list[ClientCitation]]
    type: str = "https://schema.org/Message"
    type_: str = "Message"
    context_: str = "https://schema.org"
    id_: str = ""
    usage_info: Optional[SensitivityUsageInfo] = field(default=None)


@dataclass
class ClientCitation(Model):
    """
    Represents the citations payload to be sent to the client.

    Attributes:
        @type (str): Required; must be 'Claim'
        position (str): The number and position of the citation
        appearance (Appearance): The appearance object within Citation
    """

    _attribute_map = {
        "type_": {"key": "@type", "type": "str"},
        "position": {"key": "position", "type": "int"},
        "appearance": {"key": "appearance", "type": "Appearance"},
    }

    position: int
    appearance: Appearance
    type_: str = field(default="Claim", metadata={"alias": "@type"}, init=False, repr=False)


@dataclass
class Appearance(Model):
    """
    Represents how the citation will be rendered

    Attributes:
        @type (str): Required; must be 'DigitalDocument'
        name (str): The name of the document. (max length 80)
        text (str): Optional; the appearance text of the citation.
        url (str): The url of the document
        abstract (str): Extract of the referenced content. (max length 160)
        encodingFormat (str): Encoding format of the `citation.appearance.text` field.
        image (AppearanceImage): Information about the citation’s icon.
        keywords (list[str]): Optional; set by developer. (max length 3) (max keyword length 28)
        usageInfo (SensitivityUsageInfo): The optional sensitivity content information
    """

    _attribute_map = {
        "type_": {"key": "@type", "type": "str"},
        "name": {"key": "name", "type": "str"},
        "abstract": {"key": "abstract", "type": "str"},
        "usage_info": {"key": "usageInfo", "type": "SensitivityUsageInfo"},
        "keywords": {"key": "keywords", "type": "[str]"},
        "text": {"key": "text", "type": "str"},
        "url": {"key": "url", "type": "str"},
        "encoding_format": {"key": "encodingFormat", "type": "str"},
        "image": {"key": "image", "type": "AppearanceImage"},
    }

    name: str
    abstract: str
    keywords: Optional[list[str]] = field(default=None)
    text: Optional[str] = field(default=None)
    url: Optional[str] = field(default=None)
    image: Optional[AppearanceImage] = field(default=None)
    encoding_format: Optional[
        Union[
            Literal["text/html"],
            Literal["application/vnd.microsoft.card.adaptive"],
        ]
    ] = field(default=None)
    usage_info: Optional[SensitivityUsageInfo] = field(default=None)
    type_: str = field(default="DigitalDocument", metadata={"alias": "@type"})


@dataclass
class AppearanceImage(Model):
    """
    Represents how the citation will be rendered

    Attributes:
        @type (str): Required; must be 'ImageObject'
        name (str): The image/icon name
    """

    _attribute_map = {
        "type_": {"key": "@type", "type": "str"},
        "name": {"key": "name", "type": "str"},
    }

    name: ClientCitationIconName
    type_: str = field(default="ImageObject", metadata={"alias": "@type"})


@dataclass
class SensitivityUsageInfo(Model):
    """
    Represents the sensitivity usage info for content sent to the user.
    This is used to provide information about the content to the user.

    Attributes:
        type (str): Required; must be 'https://schema.org/Message'

    """

    _attribute_map = {
        "type_": {"key": "@type", "type": "str"},
        "name": {"key": "name", "type": "str"},
        "description": {"key": "description", "type": "str"},
        "position": {"key": "position", "type": "int"},
        "pattern": {"key": "pattern", "type": "Pattern"},
    }

    name: str
    description: Optional[str] = field(default=None)
    position: Optional[int] = field(default=None)
    pattern: Optional[Pattern] = field(default=None)
    type_: str = field(default="https://schema.org/Message", metadata={"alias": "@type"})


@dataclass
class Pattern(Model):
    """
    Attributes:
        type (str): Required; must be 'DefinedTerm'
        inDefinedTermSet (str)
        name (str): Color
        termCode (str): The color code e.g. #454545

    """

    _attribute_map = {
        "type_": {"key": "@type", "type": "str"},
        "in_defined_term_set": {"key": "inDefinedTermSet", "type": "str"},
        "name": {"key": "name", "type": "str"},
        "term_code": {"key": "termCode", "type": "str"},
    }

    in_defined_term_set: str
    name: str
    term_code: str
    type_: str = field(default="DefinedTerm", metadata={"alias": "@type"})


ClientCitationIconName = Union[
    Literal["Microsoft Workd"],
    Literal["Microsoft Excel"],
    Literal["Microsoft PowerPoint"],
    Literal["Microsoft Visio"],
    Literal["Microsoft Loop"],
    Literal["Microsoft Whiteboard"],
    Literal["Adobe Illustrator"],
    Literal["Adobe Photoshop"],
    Literal["Adobe InDesign"],
    Literal["Adobe Flash"],
    Literal["Sketch"],
    Literal["Source Code"],
    Literal["Image"],
    Literal["GIF"],
    Literal["Video"],
    Literal["Sound"],
    Literal["ZIP"],
    Literal["Text"],
    Literal["PDF"],
]
