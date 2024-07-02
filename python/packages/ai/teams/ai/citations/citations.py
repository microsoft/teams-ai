"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

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
    }

    additional_type: Optional[list[str]]
    citation: Optional[list[ClientCitation]]
    type: str = "https://schema.org/Message"
    type_: str = "Message"
    context_: str = "https://schema.org"
    id_: str = ""


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
        "position": {"key": "position", "type": "str"},
        "appearance": {"key": "appearance", "type": "Appearance"},
    }

    position: str
    appearance: Appearance
    type_: str = field(default="Claim", metadata={"alias": "@type"}, init=False, repr=False)


@dataclass
class Appearance(Model):
    """
    Represents how the citation will be rendered

    Attributes:
        @type (str): Required; must be 'DigitalDocument'
        name (str): The name of the document
        text (str): Optional; ignored in Teams
        url (str): The url of the document
        abstract (str): Content of the citation. Should be clipped if longer than ~500 characters
        encodingFormat (str): The encoding format of the citation
        image (str): Used for icon; for not it is ignored
        keywords (list[str]): The optional keywords to the citation
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
        "image": {"key": "image", "type": "str"},
    }

    name: str
    abstract: str
    keywords: Optional[list[str]] = field(default=None)
    text: Optional[str] = field(default=None)
    url: Optional[str] = field(default=None)
    image: Optional[str] = field(default=None)
    encoding_format: Optional[str] = field(default=None)
    usage_info: Optional[SensitivityUsageInfo] = field(default=None)
    type_: str = field(default="DigitalDocument", metadata={"alias": "@type"})


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
