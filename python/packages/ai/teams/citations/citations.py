"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

@dataclass
class ClientCitation:
    """
    Represents the citations payload to be sent to the client.

    Attributes:
        @type (str): Required; must be 'Claim'
        position (str): The number and position of the citation
        appearance (Appearance): The appearance object within Citation
    """
    type_: str = field(default='Claim', metadata={'alias': '@type'}, init=False, repr=False )
    position: str
    appearance: Appearance


@dataclass
class Appearance:
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
    type_: str = field(default='DigitalDocument', metadata={'alias': '@type'}, init=False, repr=False )
    name: str
    text: Optional[str] = ''
    url: str = ''
    abstract: str
    encodingFormat: Optional[str] = 'text/html'
    image: Optional[str] = ''
    keywords: Optional[list[str]]
    usageInfo: SensitivityUsageInfo

@dataclass
class SensitivityUsageInfo:
    """
    Represents the sensitivity usage info for content sent to the user. This is used to provide information about the content to the user.

    Attributes:
        type (str): Required; must be 'https://schema.org/Message'

    """
    type_: str = field(default='https://schema.org/Message', init=False, repr=False)
    description: Optional[str]
    name: str
    position: Optional[int]
    pattern: Optional[Pattern]


@dataclass
class Pattern:
    """
    Attributes:
        type (str): Required; must be 'DefinedTerm'
        inDefinedTermSet (str)
        name (str): Color
        termCode (str): The color code e.g. #454545

    """
    type_: str = field(default='DefinedTerm', init=False, repr=False)
    inDefinedTermSet: str
    name: str
    termCode: str

