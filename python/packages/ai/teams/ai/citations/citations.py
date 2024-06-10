"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from msrest.serialization import Model


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
    }

    type_: str = field(default="Claim", metadata={"alias": "@type"}, init=False, repr=False)
    position: str
    appearance: Appearance


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
        "usage_info": {"key": "usageInfo", "type": "SensitivityUsageInfo"},
        "encoding_format": {"key": "encodingFormat", "type": "str"},
    }

    name: str
    abstract: str
    usage_info: Optional[SensitivityUsageInfo] = field(
        default=None, metadata={"alias": "usageInfo"}, init=False, repr=False
    )
    keywords: Optional[list[str]] = None
    type_: str = field(default="DigitalDocument", metadata={"alias": "@type"})
    text: Optional[str] = ""
    url: str = ""
    encoding_format: Optional[str] = "text/html"
    image: Optional[str] = ""


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
    }

    name: str
    description: Optional[str]
    position: Optional[int]
    pattern: Optional[Pattern]
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
        "term_code": {"key": "termCode", "type": "str"},
    }

    in_defined_term_set: str
    name: str
    term_code: str
    type_: str = field(default="DefinedTerm", metadata={"alias": "@type"})
