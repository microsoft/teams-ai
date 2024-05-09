"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Literal, Optional, Union

from dataclasses_json import DataClassJsonMixin, dataclass_json

PizzaSize = Literal["small", "medium", "large", "extra_large"]
PizzaName = Literal["Hawaiian", "Yeti", "Pig in a Forest", "Cherry Bomb"]
SaladSize = Literal["half", "whole"]
SaladStyle = Literal["Garden", "Greek"]


@dataclass_json
@dataclass
class Pizza(DataClassJsonMixin):
    item_type = "pizza"

    added_toppings: Optional[List[str]]
    "Toppings requested (examples: pepperoni, arugula)"

    removed_toppings: Optional[List[str]]
    "Toppings requested to be removed (examples: fresh garlic, anchovies)"

    name: Optional[PizzaName]
    "Used if the requester references a pizza by name"

    size: Optional[PizzaSize] = "large"
    "Size of the pizza. Default is large."

    quantity: Optional[int] = 1
    "Default is 1"


@dataclass_json
@dataclass
class NamedPizza(Pizza, DataClassJsonMixin):
    """
    Extended named pizza class
    """


@dataclass_json
@dataclass
class UnknownText(DataClassJsonMixin):
    item_type = "unknown"
    text: str
    "The text that was not understood"


@dataclass_json
@dataclass
class Beer(DataClassJsonMixin):
    item_type = "beer"
    "Type of the item"

    kind: str
    "Examples: Mack and Jacks, Sierra Nevada Pale Ale, Miller Lite"

    quantity: Optional[int] = 1
    "The number of beers. Default is 1"


@dataclass_json
@dataclass
class Salad(DataClassJsonMixin):
    item_type = "salad"

    added_ingredients: Optional[List[str]]
    "Ingredients requested (examples: parmesan, croutons)"

    removed_ingredients: Optional[List[str]]
    "Ingredients requested to be removed (example: red onions)"

    portion: Optional[SaladSize] = "half"

    style: Optional[SaladStyle] = "Garden"

    quantity: Optional[int] = 1


@dataclass_json
@dataclass
class Order(DataClassJsonMixin):
    """
    An order from a restaurant that serves pizza, beer, and salad
    """

    items: List[Union[Pizza, Beer, Salad, NamedPizza, UnknownText]]
