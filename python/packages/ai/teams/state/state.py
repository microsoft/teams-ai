"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar, Union, overload

from botbuilder.core import Storage, TurnContext

from .todict import todict

T = TypeVar("T")


@overload
def state(_cls: None = ...) -> Callable[[Type[T]], Type[T]]: ...


@overload
def state(_cls: Type[T]) -> Type[T]: ...


def state(_cls: Optional[Type[T]] = None) -> Union[Callable[[Type[T]], Type[T]], Type[T]]:
    """
    @state\n
    class Example(State):
        ...
    """

    def wrap(cls: Type[T]) -> Type[T]:
        init = cls.__init__

        def __init__(self, *args, **kwargs) -> None:
            self.__deleted__ = []
            self.__key__ = kwargs["__key__"] if "__key__" in kwargs else ""

            for key, value in kwargs.items():
                setattr(self, key, value)

            if init is not None:
                init(self, *args, **kwargs)

        cls.__init__ = __init__  # type: ignore[method-assign]

        if not hasattr(cls, "save"):
            cls.save = State.save  # type: ignore[attr-defined]

        return cls

    if _cls is None:
        return wrap

    return wrap(_cls)


class State(Dict[str, T], ABC):
    """
    State
    """

    __key__: str
    """
    The Storage Key
    """

    __deleted__: List[str]
    """
    Deleted Keys
    """

    def __init__(self, *args, **kwargs) -> None:  # pylint: disable=unused-argument
        ...

    async def save(self, _context: TurnContext, storage: Optional[Storage] = None) -> None:
        """
        Saves The State to Storage

        Args:
            context (TurnContext): the turn context.
            storage (Optional[Storage]): storage to save to.
        """
        if not storage or self.__key__ == "":
            return

        data = self.__dict__.copy()
        del data["__key__"]

        await storage.delete(self.__deleted__)
        await storage.write(
            {
                self.__key__: data,
            }
        )

    @classmethod
    @abstractmethod
    async def load(cls, context: TurnContext, storage: Optional[Storage] = None) -> "State[T]":
        """
        Loads The State from Storage

        Args:
            context: (TurnContext): the turn context.
            storage (Optional[Storage]): storage to read from.
        """

    def clear(self) -> None:
        return self.__dict__.clear()

    def copy(self) -> Dict[str, T]:
        return self.__dict__.copy()

    def has_key(self, key: str) -> bool:
        return key in self.__dict__

    def update(self, *args, **kwargs) -> None:
        return self.__dict__.update(*args, **kwargs)

    def keys(self):
        return self.__dict__.keys()

    def values(self):
        return self.__dict__.values()

    def items(self):
        return self.__dict__.items()

    def pop(self, *args):
        return self.__dict__.pop(*args)

    def __setitem__(self, key: str, item: T) -> None:
        self.__dict__[key] = item

        if key in self.__deleted__:
            self.__deleted__.remove(key)

    def __getitem__(self, key: str) -> T:
        return self.__dict__[key]

    def __delitem__(self, key: str) -> None:
        if key in self.__dict__ and isinstance(self.__dict__[key], State):
            self.__deleted__.append(self.__dict__[key].__key__)
        del self.__dict__[key]

    def __setattr__(self, key: str, value: T) -> None:
        super().__setattr__(key, value)

        if key in self.__deleted__:
            self.__deleted__.remove(key)

    def __delattr__(self, key: str) -> None:
        if key in self.__dict__ and isinstance(self.__dict__[key], State):
            self.__deleted__.append(self.__dict__[key].__key__)
        super().__delattr__(key)

    def __repr__(self) -> str:
        return repr(self.__dict__)

    def __len__(self) -> int:
        return len(self.__dict__)

    def __contains__(self, item: Any):
        return item in self.__dict__

    def __iter__(self):
        return iter(self.__dict__)

    def __str__(self) -> str:
        return json.dumps(todict(self))
